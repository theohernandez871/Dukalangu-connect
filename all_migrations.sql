-- =====================================================================
-- HOTSPOT BILLING SYSTEM — MIGRATIONS ZOTE (PHASE 1–4a)
-- =====================================================================
-- Bandika faili hili LOTE kwenye Supabase SQL Editor kisha bonyeza RUN.
-- Ni salama kuendesha mara nyingi (idempotent: if not exists / or replace).
-- Mpangilio: Auth -> RLS -> Dashboard -> Branches -> Company RLS
--            -> Routers -> Routers RLS.
-- Toleo: v4 (imeongeza Phase 4a: routers, agents, credentials).
-- =====================================================================



-- #####################################################################
-- FROM: 0001_auth_rbac.sql
-- #####################################################################

-- =====================================================================
-- PHASE 1 — AUTHENTICATION & RBAC
-- Multi-tenant: shared DB, isolation by company_id + RLS.
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
do $init$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'super_admin',
      'company_owner',
      'branch_manager',
      'cashier',
      'technician',
      'sales_agent',
      'customer',
      'guest'
    );
  end if;
end;
$init$;

-- ---------- Companies (tenants) --------------------------------------
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid,                 -- set after profile creation
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Profiles (1:1 with auth.users) ---------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  company_id          uuid references public.companies(id) on delete set null,
  email               text not null,
  full_name           text not null default '',
  phone               text,
  role                public.user_role not null default 'company_owner',
  avatar_url          text,
  is_active           boolean not null default true,
  email_verified      boolean not null default false,
  two_factor_enabled  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_profiles_company on public.profiles(company_id);

-- ---------- Audit logs ----------------------------------------------
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  company_id  uuid references public.companies(id) on delete cascade,
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_company on public.audit_logs(company_id);
create index if not exists idx_audit_actor on public.audit_logs(actor_id);

-- ---------- Helper: current user's company_id (STABLE) ---------------
-- Used inside RLS policies to avoid recursive selects.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $currentco$
  select company_id from public.profiles where id = auth.uid();
$currentco$;

-- ---------- Signup trigger: create company + owner profile -----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $newuser$
declare
  v_company_id uuid;
  v_company    text;
  v_slug       text;
  v_full_name  text;
  v_phone      text;
begin
  v_company   := coalesce(new.raw_user_meta_data ->> 'company_name', 'Kampuni');
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  v_phone     := new.raw_user_meta_data ->> 'phone';

  -- Build a unique slug from the company name.
  v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'kampuni';
  end if;
  v_slug := v_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.companies (name, slug, owner_id)
  values (v_company, v_slug, new.id)
  returning id into v_company_id;

  insert into public.profiles (id, company_id, email, full_name, phone, role, email_verified)
  values (
    new.id,
    v_company_id,
    new.email,
    v_full_name,
    v_phone,
    'company_owner',
    new.email_confirmed_at is not null
  );

  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (v_company_id, new.id, 'user.signup', jsonb_build_object('email', new.email));

  return new;
end;
$newuser$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Sync email_verified when user confirms email -------------
create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $confirmed$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null then
    update public.profiles
      set email_verified = true, updated_at = now()
      where id = new.id;
  end if;
  return new;
end;
$confirmed$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_confirmed();


-- #####################################################################
-- FROM: 0002_rls_policies.sql
-- #####################################################################

-- =====================================================================
-- PHASE 1 — ROW LEVEL SECURITY POLICIES
-- Tenant isolation enforced here. Nothing bypasses these.
-- =====================================================================

alter table public.companies  enable row level security;
alter table public.profiles   enable row level security;
alter table public.audit_logs enable row level security;

-- ---------- Companies ------------------------------------------------
-- Members can read their own company.
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select
  using (id = public.current_company_id());

-- Only the owner can update their company.
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------- Profiles -------------------------------------------------
-- A user can always read their own profile.
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select
  using (id = auth.uid());

-- A user can read profiles within the same company (for team views later).
drop policy if exists profiles_select_company on public.profiles;
create policy profiles_select_company on public.profiles
  for select
  using (company_id = public.current_company_id());

-- A user can update their own profile (name, phone, avatar).
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- Audit logs -----------------------------------------------
-- Read-only to owners/admins of the same company.
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs
  for select
  using (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'company_owner', 'branch_manager')
    )
  );

-- Inserts happen via SECURITY DEFINER functions only; no direct insert policy.


-- #####################################################################
-- FROM: 0003_dashboard.sql
-- #####################################################################

-- =====================================================================
-- PHASE 2 — DASHBOARD SUPPORT
-- Stats RPC (respects RLS via current_company_id) + notifications table.
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Dashboard stats RPC --------------------------------------
-- Returns counts scoped to the caller's company.
-- Placeholder metrics (revenue, routers) return 0 until their phase.
create or replace function public.get_dashboard_stats()
returns table (
  total_users     bigint,
  active_users    bigint,
  online_users    bigint,
  offline_users   bigint,
  revenue_today   numeric,
  revenue_month   numeric,
  routers_total   bigint,
  routers_online  bigint
)
language plpgsql
stable
security definer
set search_path = public
as $stats$
declare
  v_company uuid := public.current_company_id();
begin
  return query
  select
    (select count(*) from public.profiles p where p.company_id = v_company),
    (select count(*) from public.profiles p where p.company_id = v_company and p.is_active),
    0::bigint,          -- online_users  (Phase 4)
    0::bigint,          -- offline_users (Phase 4)
    0::numeric,         -- revenue_today (Phase 9)
    0::numeric,         -- revenue_month (Phase 9)
    0::bigint,          -- routers_total (Phase 4)
    0::bigint;          -- routers_online(Phase 4)
end;
$stats$;

-- ---------- Notifications table --------------------------------------
create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  type        text not null default 'info',
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

-- A user reads their own notifications (or company-wide broadcasts).
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select
  using (
    company_id = public.current_company_id()
    and (user_id = auth.uid() or user_id is null)
  );

-- A user marks their own notifications as read.
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- #####################################################################
-- FROM: 0004_branches.sql
-- #####################################################################

-- =====================================================================
-- PHASE 3 — COMPANY MANAGEMENT (branches, employees)
-- Every employee belongs to a branch. Signup creates an "HQ" branch.
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Branches -------------------------------------------------
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  location    text,
  phone       text,
  manager_id  uuid references public.profiles(id) on delete set null,
  is_hq       boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_branches_company on public.branches(company_id);

-- ---------- profiles.branch_id --------------------------------------
alter table public.profiles
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

create index if not exists idx_profiles_branch on public.profiles(branch_id);

-- ---------- Helper: current user's role (STABLE) --------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $userrole$
  select role from public.profiles where id = auth.uid();
$userrole$;

-- ---------- Helper: is the caller a company admin/owner? -------------
create or replace function public.is_company_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $isadmin$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'company_owner', 'branch_manager')
  );
$isadmin$;

-- ---------- Rewrite signup handler: create company + HQ + owner ------
-- Now distinguishes a fresh owner signup from an invited employee.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $newuser2$
declare
  v_company_id  uuid;
  v_branch_id   uuid;
  v_company     text;
  v_slug        text;
  v_full_name   text;
  v_phone       text;
  v_invited_co  uuid;
  v_invited_br  uuid;
  v_invited_rl  public.user_role;
begin
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  v_phone     := new.raw_user_meta_data ->> 'phone';
  v_invited_co := nullif(new.raw_user_meta_data ->> 'invited_company_id', '')::uuid;

  -- ---- Invited employee path ----
  if v_invited_co is not null then
    v_invited_br := nullif(new.raw_user_meta_data ->> 'invited_branch_id', '')::uuid;
    v_invited_rl := coalesce(
      nullif(new.raw_user_meta_data ->> 'invited_role', '')::public.user_role,
      'cashier'
    );

    insert into public.profiles (id, company_id, branch_id, email, full_name, phone, role, email_verified)
    values (new.id, v_invited_co, v_invited_br, new.email, v_full_name, v_phone, v_invited_rl,
            new.email_confirmed_at is not null);

    insert into public.audit_logs (company_id, actor_id, action, metadata)
    values (v_invited_co, new.id, 'employee.joined',
            jsonb_build_object('email', new.email, 'role', v_invited_rl));

    return new;
  end if;

  -- ---- Fresh owner path ----
  v_company := coalesce(new.raw_user_meta_data ->> 'company_name', 'Kampuni');
  v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'kampuni'; end if;
  v_slug := v_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.companies (name, slug, owner_id)
  values (v_company, v_slug, new.id)
  returning id into v_company_id;

  -- Auto-create the HQ branch.
  insert into public.branches (company_id, name, is_hq)
  values (v_company_id, 'Makao Makuu', true)
  returning id into v_branch_id;

  insert into public.profiles (id, company_id, branch_id, email, full_name, phone, role, email_verified)
  values (new.id, v_company_id, v_branch_id, new.email, v_full_name, v_phone, 'company_owner',
          new.email_confirmed_at is not null);

  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (v_company_id, new.id, 'user.signup', jsonb_build_object('email', new.email));

  return new;
end;
$newuser2$;


-- #####################################################################
-- FROM: 0005_company_rls.sql
-- #####################################################################

-- =====================================================================
-- PHASE 3 — RLS & SECURITY
-- Branch isolation + employee management + privilege-escalation guard.
-- =====================================================================

alter table public.branches enable row level security;

-- ---------- Branches -------------------------------------------------
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select
  using (company_id = public.current_company_id());

drop policy if exists branches_insert on public.branches;
create policy branches_insert on public.branches
  for insert
  with check (company_id = public.current_company_id() and public.is_company_admin());

drop policy if exists branches_update on public.branches;
create policy branches_update on public.branches
  for update
  using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

drop policy if exists branches_delete on public.branches;
create policy branches_delete on public.branches
  for delete
  using (
    company_id = public.current_company_id()
    and public.is_company_admin()
    and is_hq = false            -- never delete HQ
  );

-- ---------- Profiles: admin management of employees ------------------
-- Admins can update employees within their company (role, branch, active).
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update
  using (
    company_id = public.current_company_id()
    and public.is_company_admin()
  )
  with check (company_id = public.current_company_id());

-- ---------- Privilege-escalation & owner-protection guard -----------
-- Prevents: self-escalation, editing the owner, or assigning super_admin.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $guard$
declare
  _actor_role public.user_role := public.current_user_role();
  _owner_id   uuid;
begin
  -- Nobody may set a profile to super_admin via the app.
  if new.role = 'super_admin' and old.role <> 'super_admin' then
    raise exception 'Hairuhusiwi kuweka super_admin';
  end if;

  -- A user cannot elevate their own role.
  if new.id = auth.uid() and new.role <> old.role then
    raise exception 'Huwezi kubadilisha jukumu lako mwenyewe';
  end if;

  -- The company owner cannot be demoted or deactivated by others.
  select c.owner_id into _owner_id
    from public.companies c
    where c.id = old.company_id;

  if old.id = _owner_id and new.id <> auth.uid() then
    if new.role <> old.role or new.is_active <> old.is_active then
      raise exception 'Mmiliki wa kampuni hawezi kubadilishwa';
    end if;
  end if;

  -- Branch managers may not create owners.
  if _actor_role = 'branch_manager' and new.role = 'company_owner' then
    raise exception 'Meneja wa tawi hawezi kuunda mmiliki';
  end if;

  return new;
end;
$guard$;

drop trigger if exists trg_guard_profile_update on public.profiles;
create trigger trg_guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------- Audit trigger for branch changes ------------------------
create or replace function public.audit_branch_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $auditbranch$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op
      when 'INSERT' then 'branch.create'
      when 'UPDATE' then 'branch.update'
      else 'branch.delete'
    end,
    jsonb_build_object('branch', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$auditbranch$;

drop trigger if exists trg_audit_branch on public.branches;
create trigger trg_audit_branch
  after insert or update or delete on public.branches
  for each row execute function public.audit_branch_change();


-- #####################################################################
-- FROM: 0006_routers.sql
-- #####################################################################

-- =====================================================================
-- PHASE 4a — ROUTERS (MikroTik) + AGENTS
-- Connection model: on-site Agent (works behind CGNAT/NAT), Hybrid-ready.
-- Credentials are NEVER exposed to the browser (see credential columns).
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
do $rtenum$
begin
  if not exists (select 1 from pg_type where typname = 'router_connection_type') then
    create type public.router_connection_type as enum ('agent', 'direct');
  end if;
  if not exists (select 1 from pg_type where typname = 'router_status') then
    create type public.router_status as enum ('online', 'offline', 'unknown', 'error');
  end if;
end;
$rtenum$;

-- ---------- Routers --------------------------------------------------
create table if not exists public.routers (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  branch_id        uuid references public.branches(id) on delete set null,
  name             text not null,
  connection_type  public.router_connection_type not null default 'agent',

  -- For 'direct' connections only (public IP / port-forward).
  host             text,
  api_port         integer not null default 8728,

  -- RouterOS username. The PASSWORD is never stored here in plain text;
  -- it lives in `router_credentials` (service-role only, no RLS select).
  username         text,

  -- Live status (updated by the agent / test).
  status           public.router_status not null default 'unknown',
  os_version       text,
  model            text,
  last_seen        timestamptz,

  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_routers_company on public.routers(company_id);
create index if not exists idx_routers_branch on public.routers(branch_id);

-- ---------- Router credentials (SECRET — no client access) ----------
-- Separate table so RLS can block ALL client reads. Only Edge Functions
-- using the service role may read/write here. Password stored encrypted
-- (encryption applied in Phase 4b via Edge Function + vault).
create table if not exists public.router_credentials (
  router_id        uuid primary key references public.routers(id) on delete cascade,
  password_enc     text,          -- encrypted blob (never plain text)
  updated_at       timestamptz not null default now()
);

-- ---------- Router agents -------------------------------------------
-- One agent per site; connects outbound to our Edge Function.
create table if not exists public.router_agents (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  router_id        uuid references public.routers(id) on delete set null,
  name             text not null default 'Agent',
  -- Hash of the agent token; raw token shown once at creation.
  token_hash       text not null,
  last_ping        timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_agents_company on public.router_agents(company_id);

-- ---------- Router status history (uptime tracking) ------------------
create table if not exists public.router_status_history (
  id           bigint generated always as identity primary key,
  router_id    uuid not null references public.routers(id) on delete cascade,
  status       public.router_status not null,
  cpu_load     integer,
  mem_used     bigint,
  recorded_at  timestamptz not null default now()
);

create index if not exists idx_status_history_router
  on public.router_status_history(router_id, recorded_at desc);

-- ---------- updated_at touch trigger --------------------------------
create or replace function public.touch_router_updated()
returns trigger
language plpgsql
as $touchrt$
begin
  new.updated_at := now();
  return new;
end;
$touchrt$;

drop trigger if exists trg_touch_router on public.routers;
create trigger trg_touch_router
  before update on public.routers
  for each row execute function public.touch_router_updated();

-- ---------- Audit trigger for router changes ------------------------
create or replace function public.audit_router_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $auditrt$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op
      when 'INSERT' then 'router.create'
      when 'UPDATE' then 'router.update'
      else 'router.delete'
    end,
    jsonb_build_object('router', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$auditrt$;

drop trigger if exists trg_audit_router on public.routers;
create trigger trg_audit_router
  after insert or update or delete on public.routers
  for each row execute function public.audit_router_change();


-- #####################################################################
-- FROM: 0007_routers_rls.sql
-- #####################################################################

-- =====================================================================
-- PHASE 4a — RLS FOR ROUTERS
-- Company isolation. Credentials table is fully locked from clients.
-- =====================================================================

alter table public.routers               enable row level security;
alter table public.router_credentials    enable row level security;
alter table public.router_agents         enable row level security;
alter table public.router_status_history enable row level security;

-- ---------- Routers --------------------------------------------------
drop policy if exists routers_select on public.routers;
create policy routers_select on public.routers
  for select
  using (company_id = public.current_company_id());

drop policy if exists routers_insert on public.routers;
create policy routers_insert on public.routers
  for insert
  with check (
    company_id = public.current_company_id()
    and public.is_company_admin()
  );

drop policy if exists routers_update on public.routers;
create policy routers_update on public.routers
  for update
  using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

drop policy if exists routers_delete on public.routers;
create policy routers_delete on public.routers
  for delete
  using (company_id = public.current_company_id() and public.is_company_admin());

-- ---------- Router credentials: NO client access at all --------------
-- No policies are created for SELECT/INSERT/UPDATE, so with RLS enabled
-- the anon/authenticated roles can never read secrets. Only the
-- service-role (Edge Functions) bypasses RLS to manage these.

-- ---------- Router agents --------------------------------------------
drop policy if exists agents_select on public.router_agents;
create policy agents_select on public.router_agents
  for select
  using (company_id = public.current_company_id());

drop policy if exists agents_insert on public.router_agents;
create policy agents_insert on public.router_agents
  for insert
  with check (company_id = public.current_company_id() and public.is_company_admin());

drop policy if exists agents_delete on public.router_agents;
create policy agents_delete on public.router_agents
  for delete
  using (company_id = public.current_company_id() and public.is_company_admin());

-- ---------- Router status history ------------------------------------
drop policy if exists status_history_select on public.router_status_history;
create policy status_history_select on public.router_status_history
  for select
  using (
    exists (
      select 1 from public.routers r
      where r.id = router_id
        and r.company_id = public.current_company_id()
    )
  );

