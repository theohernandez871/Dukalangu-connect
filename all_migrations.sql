-- =====================================================================
-- HOTSPOT BILLING SYSTEM — MIGRATIONS ZOTE (PHASE 1–8B + fixes)
-- =====================================================================
-- Bandika faili hili LOTE kwenye Supabase SQL Editor kisha bonyeza RUN.
-- Ni salama kuendesha mara nyingi (idempotent).
-- Toleo: v11 (imeongeza 0017: credential read fix - vault via RPC).
-- Inahitaji "supabase_vault" + "pgcrypto" (SQL inaziwasha yenyewe).
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


-- #####################################################################
-- FROM: 0008_router_commands.sql
-- #####################################################################

-- =====================================================================
-- PHASE 4b — AGENT PROTOCOL: command queue + credential encryption
-- Transport: HTTP long-polling. Encryption: Supabase Vault.
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Vault (encryption) --------------------------------------
-- Supabase ships the `supabase_vault` extension. Secrets live outside
-- the data tables; we store only the secret's UUID reference.
create extension if not exists supabase_vault with schema vault;

-- Replace plain-text column with a Vault secret reference.
alter table public.router_credentials
  add column if not exists secret_id uuid;

-- Old column (password_enc) kept for compatibility; no longer written.
-- New writes go through set_router_password() below.

-- ---------- Command status enum -------------------------------------
do $cmdenum$
begin
  if not exists (select 1 from pg_type where typname = 'router_command_status') then
    create type public.router_command_status as enum
      ('pending', 'running', 'done', 'failed', 'timeout');
  end if;
end;
$cmdenum$;

-- ---------- Router command queue ------------------------------------
create table if not exists public.router_commands (
  id            uuid primary key default gen_random_uuid(),
  router_id     uuid not null references public.routers(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  requested_by  uuid references auth.users(id) on delete set null,
  command       text not null,             -- e.g. 'identity', 'ping', 'hotspot.list'
  params        jsonb not null default '{}'::jsonb,
  status        public.router_command_status not null default 'pending',
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

create index if not exists idx_commands_router on public.router_commands(router_id, status);
create index if not exists idx_commands_pending
  on public.router_commands(router_id) where status = 'pending';

-- ---------- Store a router password into Vault ----------------------
-- SECURITY DEFINER so only this controlled path writes secrets.
-- Returns nothing; the raw password never leaves the server.
create or replace function public.set_router_password(p_router_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $setpw$
declare
  _company    uuid;
  _secret_id  uuid;
  _secret_name text;
begin
  -- Verify the caller manages this router's company.
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null or _company <> public.current_company_id() then
    raise exception 'Router si ya kampuni yako';
  end if;
  if not public.is_company_admin() then
    raise exception 'Hauna ruhusa';
  end if;

  _secret_name := 'router_' || p_router_id::text;

  -- Create or update the Vault secret.
  select secret_id into _secret_id from public.router_credentials where router_id = p_router_id;

  if _secret_id is null then
    _secret_id := vault.create_secret(p_password, _secret_name, 'RouterOS password');
    insert into public.router_credentials (router_id, secret_id)
    values (p_router_id, _secret_id)
    on conflict (router_id) do update set secret_id = excluded.secret_id, updated_at = now();
  else
    perform vault.update_secret(_secret_id, p_password);
    update public.router_credentials set updated_at = now() where router_id = p_router_id;
  end if;
end;
$setpw$;

-- ---------- Enqueue a command (client-facing, RLS-safe) -------------
create or replace function public.enqueue_router_command(
  p_router_id uuid,
  p_command   text,
  p_params    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $enqueue$
declare
  _company uuid;
  _id      uuid;
begin
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null or _company <> public.current_company_id() then
    raise exception 'Router si ya kampuni yako';
  end if;

  insert into public.router_commands (router_id, company_id, requested_by, command, params)
  values (p_router_id, _company, auth.uid(), p_command, p_params)
  returning id into _id;

  return _id;
end;
$enqueue$;


-- #####################################################################
-- FROM: 0009_commands_rls.sql
-- #####################################################################

-- =====================================================================
-- PHASE 4b — RLS FOR ROUTER COMMANDS
-- Clients read their company's commands; they enqueue only via the
-- enqueue_router_command() function. Agents use service-role (bypass RLS).
-- =====================================================================

alter table public.router_commands enable row level security;

-- Read command history / results for your company.
drop policy if exists commands_select on public.router_commands;
create policy commands_select on public.router_commands
  for select
  using (company_id = public.current_company_id());

-- No direct INSERT/UPDATE policies: writes happen through
-- enqueue_router_command() (SECURITY DEFINER) and the agent endpoints
-- (service-role). This prevents clients from forging commands or
-- writing arbitrary results.


-- #####################################################################
-- FROM: 0010_agent_tokens.sql
-- #####################################################################

-- =====================================================================
-- PHASE 4b — AGENT TOKEN + POLL/REPORT SUPPORT
-- Agent token: raw shown once; only its hash is stored.
-- =====================================================================

-- pgcrypto for digest()/gen_random_bytes()
create extension if not exists pgcrypto with schema extensions;

-- ---------- Create an agent, returning the RAW token once -----------
create or replace function public.create_router_agent(
  p_name      text,
  p_router_id uuid default null
)
returns table (agent_id uuid, raw_token text)
language plpgsql
security definer
set search_path = public, extensions
as $createagent$
declare
  _company uuid := public.current_company_id();
  _token   text;
  _hash    text;
  _id      uuid;
begin
  if _company is null or not public.is_company_admin() then
    raise exception 'Hauna ruhusa ya kutengeneza agent';
  end if;

  -- 32-byte random token, hex-encoded.
  _token := encode(extensions.gen_random_bytes(32), 'hex');
  _hash  := encode(extensions.digest(_token, 'sha256'), 'hex');

  insert into public.router_agents (company_id, router_id, name, token_hash)
  values (_company, p_router_id, coalesce(p_name, 'Agent'), _hash)
  returning id into _id;

  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (_company, auth.uid(), 'agent.create', jsonb_build_object('name', p_name));

  agent_id := _id;
  raw_token := _token;
  return next;
end;
$createagent$;

-- ---------- Rotate / revoke helpers ---------------------------------
create or replace function public.revoke_router_agent(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $revoke$
begin
  if not public.is_company_admin() then
    raise exception 'Hauna ruhusa';
  end if;
  update public.router_agents
     set is_active = false
   where id = p_agent_id
     and company_id = public.current_company_id();
end;
$revoke$;


-- #####################################################################
-- FROM: 0011_omada.sql
-- #####################################################################

-- =====================================================================
-- PHASE 5 — TP-LINK OMADA CONTROLLERS
-- Hybrid: 'cloud' (public URL, via Edge Function) or 'local' (via agent).
-- Credentials stored in Vault (like Phase 4b). Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Enum -----------------------------------------------------
do $omadaenum$
begin
  if not exists (select 1 from pg_type where typname = 'omada_connection_type') then
    create type public.omada_connection_type as enum ('cloud', 'local');
  end if;
end;
$omadaenum$;

-- ---------- Omada controllers ----------------------------------------
create table if not exists public.omada_controllers (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  branch_id        uuid references public.branches(id) on delete set null,
  name             text not null,
  connection_type  public.omada_connection_type not null default 'cloud',

  -- Base URL of the controller, e.g. https://omada.example.com:8043
  base_url         text,
  -- Omada Controller ID (omadacId) + Site name/id.
  omadac_id        text,
  site_id          text,
  username         text,

  status           public.router_status not null default 'unknown',
  last_seen        timestamptz,

  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_omada_company on public.omada_controllers(company_id);

-- ---------- Omada credentials (SECRET — Vault) -----------------------
create table if not exists public.omada_credentials (
  controller_id  uuid primary key references public.omada_controllers(id) on delete cascade,
  secret_id      uuid,
  updated_at     timestamptz not null default now()
);

-- ---------- Store password into Vault --------------------------------
create or replace function public.set_omada_password(p_controller_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $setomadapw$
declare
  _company   uuid;
  _secret_id uuid;
begin
  select company_id into _company from public.omada_controllers where id = p_controller_id;
  if _company is null or _company <> public.current_company_id() then
    raise exception 'Controller si ya kampuni yako';
  end if;
  if not public.is_company_admin() then
    raise exception 'Hauna ruhusa';
  end if;

  select secret_id into _secret_id from public.omada_credentials where controller_id = p_controller_id;

  if _secret_id is null then
    _secret_id := vault.create_secret(p_password, 'omada_' || p_controller_id::text, 'Omada password');
    insert into public.omada_credentials (controller_id, secret_id)
    values (p_controller_id, _secret_id)
    on conflict (controller_id) do update set secret_id = excluded.secret_id, updated_at = now();
  else
    perform vault.update_secret(_secret_id, p_password);
    update public.omada_credentials set updated_at = now() where controller_id = p_controller_id;
  end if;
end;
$setomadapw$;

-- ---------- updated_at + audit triggers ------------------------------
drop trigger if exists trg_touch_omada on public.omada_controllers;
create trigger trg_touch_omada
  before update on public.omada_controllers
  for each row execute function public.touch_router_updated();

create or replace function public.audit_omada_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $auditomada$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op when 'INSERT' then 'omada.create' when 'UPDATE' then 'omada.update' else 'omada.delete' end,
    jsonb_build_object('controller', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$auditomada$;

drop trigger if exists trg_audit_omada on public.omada_controllers;
create trigger trg_audit_omada
  after insert or update or delete on public.omada_controllers
  for each row execute function public.audit_omada_change();

-- ---------- RLS ------------------------------------------------------
alter table public.omada_controllers  enable row level security;
alter table public.omada_credentials  enable row level security;

drop policy if exists omada_select on public.omada_controllers;
create policy omada_select on public.omada_controllers
  for select using (company_id = public.current_company_id());

drop policy if exists omada_insert on public.omada_controllers;
create policy omada_insert on public.omada_controllers
  for insert with check (company_id = public.current_company_id() and public.is_company_admin());

drop policy if exists omada_update on public.omada_controllers;
create policy omada_update on public.omada_controllers
  for update using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

drop policy if exists omada_delete on public.omada_controllers;
create policy omada_delete on public.omada_controllers
  for delete using (company_id = public.current_company_id() and public.is_company_admin());

-- omada_credentials: no client policies (service-role only).


-- #####################################################################
-- FROM: 0012_packages.sql
-- #####################################################################

-- =====================================================================
-- PHASE 6 — PACKAGE MANAGEMENT
-- Single flexible table: `type` + relevant fields (NULL when unused).
-- CHECK constraints enforce which fields each type requires.
-- Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
do $pkgenum$
begin
  if not exists (select 1 from pg_type where typname = 'package_type') then
    create type public.package_type as enum
      ('unlimited', 'time', 'data', 'speed', 'night', 'weekend', 'monthly', 'custom');
  end if;
  if not exists (select 1 from pg_type where typname = 'duration_unit') then
    create type public.duration_unit as enum ('minute', 'hour', 'day', 'week', 'month');
  end if;
end;
$pkgenum$;

-- ---------- Packages -------------------------------------------------
create table if not exists public.packages (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  branch_id        uuid references public.branches(id) on delete set null,

  type             public.package_type not null default 'time',
  name             text not null,
  description      text,

  price            numeric(12,2) not null default 0,
  currency         text not null default 'TZS',

  -- Validity / duration (time, monthly, unlimited use these).
  duration_value   integer,
  duration_unit    public.duration_unit,

  -- Data cap in megabytes (data/custom). NULL = unlimited data.
  data_limit_mb    bigint,

  -- Bandwidth caps in kbps (speed/custom). NULL = unshaped.
  speed_down_kbps  integer,
  speed_up_kbps    integer,

  -- Time restrictions for night/weekend/custom, e.g.
  -- {"start":"22:00","end":"06:00","days":[0,6]}.
  time_window      jsonb,

  -- Name of the RouterOS/Omada profile to apply on activation.
  router_profile   text,

  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Per-type minimum requirements (validation at DB level too).
  constraint pkg_price_nonneg check (price >= 0),
  constraint pkg_time_needs_duration
    check (type <> 'time' or (duration_value is not null and duration_unit is not null)),
  constraint pkg_data_needs_limit
    check (type <> 'data' or data_limit_mb is not null),
  constraint pkg_speed_needs_rate
    check (type <> 'speed' or (speed_down_kbps is not null))
);

create index if not exists idx_packages_company on public.packages(company_id);
create index if not exists idx_packages_branch on public.packages(branch_id);
create index if not exists idx_packages_active on public.packages(company_id) where is_active;

-- ---------- updated_at + audit --------------------------------------
create or replace function public.touch_package_updated()
returns trigger
language plpgsql
as $touchpkg$
begin
  new.updated_at := now();
  return new;
end;
$touchpkg$;

drop trigger if exists trg_touch_package on public.packages;
create trigger trg_touch_package
  before update on public.packages
  for each row execute function public.touch_package_updated();

create or replace function public.audit_package_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $auditpkg$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op when 'INSERT' then 'package.create' when 'UPDATE' then 'package.update' else 'package.delete' end,
    jsonb_build_object('package', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$auditpkg$;

drop trigger if exists trg_audit_package on public.packages;
create trigger trg_audit_package
  after insert or update or delete on public.packages
  for each row execute function public.audit_package_change();

-- ---------- RLS ------------------------------------------------------
alter table public.packages enable row level security;

drop policy if exists packages_select on public.packages;
create policy packages_select on public.packages
  for select using (company_id = public.current_company_id());

drop policy if exists packages_insert on public.packages;
create policy packages_insert on public.packages
  for insert with check (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin','company_owner','branch_manager','sales_agent')
    )
  );

drop policy if exists packages_update on public.packages;
create policy packages_update on public.packages
  for update using (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin','company_owner','branch_manager','sales_agent')
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists packages_delete on public.packages;
create policy packages_delete on public.packages
  for delete using (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin','company_owner','branch_manager')
    )
  );


-- #####################################################################
-- FROM: 0013_vouchers.sql
-- #####################################################################

-- =====================================================================
-- PHASE 7 — VOUCHER MANAGEMENT
-- Numeric codes (keypad-friendly). Batches group vouchers.
-- generate_vouchers() creates many unique codes atomically.
-- Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Enum -----------------------------------------------------
do $vchenum$
begin
  if not exists (select 1 from pg_type where typname = 'voucher_status') then
    create type public.voucher_status as enum ('unused', 'used', 'expired', 'disabled');
  end if;
end;
$vchenum$;

-- ---------- Voucher batches ------------------------------------------
create table if not exists public.voucher_batches (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  branch_id    uuid references public.branches(id) on delete set null,
  package_id   uuid references public.packages(id) on delete set null,
  count        integer not null default 0,
  prefix       text,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_batches_company on public.voucher_batches(company_id);

-- ---------- Vouchers -------------------------------------------------
create table if not exists public.vouchers (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  batch_id     uuid references public.voucher_batches(id) on delete cascade,
  package_id   uuid references public.packages(id) on delete set null,
  code         text not null,
  status       public.voucher_status not null default 'unused',
  used_at      timestamptz,
  used_by      text,                       -- device MAC / identifier (Phase 8)
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (company_id, code)
);

create index if not exists idx_vouchers_company on public.vouchers(company_id, status);
create index if not exists idx_vouchers_batch on public.vouchers(batch_id);
create index if not exists idx_vouchers_code on public.vouchers(company_id, code);

-- ---------- Generate a batch of numeric vouchers --------------------
-- Returns the new batch_id. Codes are numeric, `p_length` digits,
-- optionally grouped for display client-side.
create or replace function public.generate_vouchers(
  p_package_id uuid,
  p_count      integer,
  p_length     integer default 8,
  p_prefix     text default null,
  p_notes      text default null,
  p_branch_id  uuid default null,
  p_valid_days integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $genvouchers$
declare
  _company   uuid := public.current_company_id();
  _batch_id  uuid;
  _code      text;
  _made      integer := 0;
  _attempts  integer := 0;
  _expires   timestamptz;
begin
  if _company is null then
    raise exception 'Haujaidhinishwa';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','company_owner','branch_manager','sales_agent')
  ) then
    raise exception 'Hauna ruhusa ya kutengeneza vocha';
  end if;
  if p_count < 1 or p_count > 1000 then
    raise exception 'Idadi lazima iwe kati ya 1 na 1000';
  end if;

  if p_valid_days is not null then
    _expires := now() + (p_valid_days || ' days')::interval;
  end if;

  insert into public.voucher_batches (company_id, branch_id, package_id, count, prefix, notes, created_by)
  values (_company, p_branch_id, p_package_id, p_count, p_prefix, p_notes, auth.uid())
  returning id into _batch_id;

  while _made < p_count and _attempts < p_count * 20 loop
    _attempts := _attempts + 1;
    -- Random numeric string of p_length digits.
    _code := lpad((floor(random() * (10::numeric ^ p_length)))::bigint::text, p_length, '0');
    if p_prefix is not null and p_prefix <> '' then
      _code := p_prefix || _code;
    end if;

    begin
      insert into public.vouchers (company_id, batch_id, package_id, code, expires_at)
      values (_company, _batch_id, p_package_id, _code, _expires);
      _made := _made + 1;
    exception when unique_violation then
      -- Collision: try another code.
      null;
    end;
  end loop;

  update public.voucher_batches set count = _made where id = _batch_id;

  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (_company, auth.uid(), 'voucher.batch_create',
          jsonb_build_object('count', _made, 'batch', _batch_id));

  return _batch_id;
end;
$genvouchers$;

-- ---------- RLS ------------------------------------------------------
alter table public.voucher_batches enable row level security;
alter table public.vouchers        enable row level security;

drop policy if exists batches_select on public.voucher_batches;
create policy batches_select on public.voucher_batches
  for select using (company_id = public.current_company_id());

drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers
  for select using (company_id = public.current_company_id());

-- Disabling/enabling individual vouchers by admins.
drop policy if exists vouchers_update on public.vouchers;
create policy vouchers_update on public.vouchers
  for update using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

-- Deleting a batch (cascades to its vouchers) by admins.
drop policy if exists batches_delete on public.voucher_batches;
create policy batches_delete on public.voucher_batches
  for delete using (company_id = public.current_company_id() and public.is_company_admin());

-- Inserts happen only via generate_vouchers() (SECURITY DEFINER).


-- #####################################################################
-- FROM: 0014_agent_realtime.sql
-- #####################################################################

-- =====================================================================
-- PHASE 8A-1 — ENTERPRISE AGENT: metrics, commands, sync cache, realtime
-- Transport: agent long-polling (in) + Supabase Realtime (dashboard out).
-- Agent becomes the ONLY connection method (direct deprecated).
-- Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Router live metrics (updated by heartbeat) --------------
alter table public.routers
  add column if not exists cpu_load       integer,
  add column if not exists mem_used       bigint,
  add column if not exists mem_total      bigint,
  add column if not exists uptime         text,
  add column if not exists board_name     text,
  add column if not exists connected_users integer,
  add column if not exists ping_ms        integer,
  add column if not exists response_ms    integer,
  add column if not exists agent_id       uuid references public.router_agents(id) on delete set null;

-- Default new routers to 'agent' connection; deprecate 'direct' in UI.
alter table public.routers
  alter column connection_type set default 'agent';

-- ---------- Expanded command set ------------------------------------
-- Extend allowed commands via a catalog table (server-validated).
create table if not exists public.router_command_catalog (
  command   text primary key,
  label     text not null,
  mutating  boolean not null default false
);

insert into public.router_command_catalog (command, label, mutating) values
  ('identity', 'Kitambulisho', false),
  ('resource', 'Rasilimali', false),
  ('sync.all', 'Sync yote', false),
  ('hotspot.active', 'Watumiaji hai', false),
  ('hotspot.users', 'Watumiaji wa hotspot', false),
  ('hotspot.profiles', 'Profiles za hotspot', false),
  ('hotspot.kick', 'Ondoa mtumiaji', true),
  ('hotspot.create_user', 'Tengeneza voucher/user', true),
  ('hotspot.delete_user', 'Futa voucher/user', true),
  ('hotspot.create_profile', 'Tengeneza package/profile', true),
  ('hotspot.update_profile', 'Sasisha package/profile', true),
  ('pppoe.secrets', 'Akaunti za PPPoE', false),
  ('pppoe.active', 'PPPoE hai', false),
  ('pppoe.disconnect', 'Kata PPPoE', true),
  ('ppp.profiles', 'Profiles za PPP', false),
  ('dhcp.leases', 'DHCP leases', false),
  ('queue.simple', 'Simple queues', false),
  ('firewall.filter', 'Firewall', false),
  ('agent.restart', 'Restart agent', true)
on conflict (command) do update set label = excluded.label, mutating = excluded.mutating;

-- ---------- Synced router data cache --------------------------------
-- The agent pushes RouterOS data here so the dashboard reads from DB
-- (real-time via Supabase Realtime) instead of waiting for a command.
create table if not exists public.router_sync_data (
  id           bigint generated always as identity primary key,
  router_id    uuid not null references public.routers(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  kind         text not null,             -- 'hotspot.active','pppoe.secrets',...
  payload      jsonb not null default '[]'::jsonb,
  synced_at    timestamptz not null default now(),
  unique (router_id, kind)
);

create index if not exists idx_sync_router on public.router_sync_data(router_id);

-- ---------- RLS for new tables --------------------------------------
alter table public.router_sync_data enable row level security;

drop policy if exists sync_select on public.router_sync_data;
create policy sync_select on public.router_sync_data
  for select using (company_id = public.current_company_id());

-- catalog is world-readable reference data.
alter table public.router_command_catalog enable row level security;
drop policy if exists catalog_select on public.router_command_catalog;
create policy catalog_select on public.router_command_catalog
  for select using (true);

-- Sync writes happen via service-role (agent endpoints) only.

-- ---------- Offline detection ---------------------------------------
-- Marks routers offline when their last heartbeat is older than the
-- threshold (default 90s = 3 missed 30s beats). Called by a cron job
-- and/or on dashboard load.
create or replace function public.mark_stale_routers_offline(p_threshold_seconds integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $markoffline$
declare
  _count integer;
begin
  update public.routers
     set status = 'offline'
   where status = 'online'
     and last_seen is not null
     and last_seen < now() - make_interval(secs => p_threshold_seconds);
  get diagnostics _count = row_count;
  return _count;
end;
$markoffline$;

-- ---------- Enable Realtime for dashboard live updates --------------
-- Adds tables to the realtime publication (idempotent-safe).
do $realtime$
begin
  begin
    alter publication supabase_realtime add table public.routers;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.router_sync_data;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.router_commands;
  exception when duplicate_object then null; end;
end;
$realtime$;

-- ---------- Cron: sweep offline routers every minute -----------------
-- Uses pg_cron if available. Safe if the extension is absent.
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'mark-stale-routers-offline',
      '* * * * *',
      $job$ select public.mark_stale_routers_offline(90); $job$
    );
  end if;
exception when others then
  -- If scheduling fails (permissions/duplicate), ignore; dashboard also sweeps.
  null;
end;
$cron$;


-- #####################################################################
-- FROM: 0015_portal.sql
-- #####################################################################

-- =====================================================================
-- PHASE 8B-1 — CUSTOMER PORTAL (Captive Portal)
-- Public-facing settings, ads, offers, announcements per company.
-- Portal reads via a SECURITY DEFINER function (no auth needed).
-- Voucher verification + hotspot activation via Edge Function.
-- Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Portal settings (one row per company) -------------------
create table if not exists public.portal_settings (
  company_id       uuid primary key references public.companies(id) on delete cascade,
  -- Public slug used in the portal URL: /portal/:slug
  slug             text unique,
  brand_name       text,
  logo_url         text,
  primary_color    text default '#059669',
  welcome_title    text default 'Karibu',
  welcome_message  text,
  support_phone    text,
  is_enabled       boolean not null default true,
  updated_at       timestamptz not null default now()
);

-- ---------- Advertisement banners -----------------------------------
create table if not exists public.portal_ads (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  title        text,
  image_url    text not null,
  link_url     text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_ads_company on public.portal_ads(company_id) where is_active;

-- ---------- Offers (promo packages) ---------------------------------
create table if not exists public.portal_offers (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  package_id   uuid references public.packages(id) on delete set null,
  title        text not null,
  description  text,
  promo_price  numeric(12,2),
  badge        text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_offers_company on public.portal_offers(company_id) where is_active;

-- ---------- Announcements -------------------------------------------
create table if not exists public.portal_announcements (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  title        text not null,
  body         text,
  level        text not null default 'info',   -- info | warning | success
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_ann_company on public.portal_announcements(company_id) where is_active;

-- ---------- updated_at trigger for settings -------------------------
create or replace function public.touch_portal_settings()
returns trigger language plpgsql as $touchportal$
begin new.updated_at := now(); return new; end;
$touchportal$;

drop trigger if exists trg_touch_portal on public.portal_settings;
create trigger trg_touch_portal before update on public.portal_settings
  for each row execute function public.touch_portal_settings();

-- ---------- Auto-create default settings + slug on company ----------
-- Reuse the company signup flow: give each new company a portal slug.
create or replace function public.ensure_portal_settings(p_company_id uuid)
returns void language plpgsql security definer set search_path = public
as $ensureportal$
declare _slug text; _name text;
begin
  if exists (select 1 from public.portal_settings where company_id = p_company_id) then
    return;
  end if;
  select name into _name from public.companies where id = p_company_id;
  _slug := lower(regexp_replace(coalesce(_name, 'portal'), '[^a-zA-Z0-9]+', '-', 'g'))
           || '-' || substr(p_company_id::text, 1, 6);
  insert into public.portal_settings (company_id, slug, brand_name, welcome_message)
  values (p_company_id, _slug, _name, 'Ingiza namba ya vocha yako ili kuunganisha.')
  on conflict (company_id) do nothing;
end;
$ensureportal$;

-- ---------- Public portal read (no auth) ----------------------------
-- Returns everything the portal needs for a slug, in one call.
create or replace function public.get_portal(p_slug text)
returns jsonb language plpgsql security definer set search_path = public
as $getportal$
declare _company uuid; _result jsonb;
begin
  select company_id into _company from public.portal_settings
   where slug = p_slug and is_enabled = true;
  if _company is null then
    return null;
  end if;

  select jsonb_build_object(
    'settings', (select to_jsonb(s) from public.portal_settings s where s.company_id = _company),
    'ads', coalesce((select jsonb_agg(to_jsonb(a) order by a.sort_order)
        from public.portal_ads a
       where a.company_id = _company and a.is_active
         and (a.starts_at is null or a.starts_at <= now())
         and (a.ends_at is null or a.ends_at >= now())), '[]'::jsonb),
    'offers', coalesce((select jsonb_agg(to_jsonb(o) order by o.sort_order)
        from public.portal_offers o
       where o.company_id = _company and o.is_active), '[]'::jsonb),
    'announcements', coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc)
        from public.portal_announcements n
       where n.company_id = _company and n.is_active), '[]'::jsonb)
  ) into _result;

  return _result;
end;
$getportal$;

grant execute on function public.get_portal(text) to anon;

-- ---------- Public voucher redemption (no auth) ---------------------
-- Verifies a voucher for a portal slug, marks it used, and enqueues a
-- hotspot activation command to the branch's router (if resolvable).
-- Returns a JSON result the portal shows to the customer.
create or replace function public.portal_redeem_voucher(p_slug text, p_code text, p_mac text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $redeem$
declare
  _company    uuid;
  _voucher    record;
  _pkg        record;
  _router     uuid;
begin
  select company_id into _company from public.portal_settings
   where slug = p_slug and is_enabled = true;
  if _company is null then
    return jsonb_build_object('ok', false, 'error', 'Portal haipatikani');
  end if;

  -- Normalize: strip spaces the portal may add for readability.
  p_code := replace(p_code, ' ', '');

  select * into _voucher from public.vouchers
   where company_id = _company and code = p_code
   limit 1;

  if _voucher.id is null then
    return jsonb_build_object('ok', false, 'error', 'Vocha haipo');
  end if;
  if _voucher.status = 'used' then
    return jsonb_build_object('ok', false, 'error', 'Vocha imeshatumika');
  end if;
  if _voucher.status = 'disabled' then
    return jsonb_build_object('ok', false, 'error', 'Vocha imezimwa');
  end if;
  if _voucher.expires_at is not null and _voucher.expires_at < now() then
    update public.vouchers set status = 'expired' where id = _voucher.id;
    return jsonb_build_object('ok', false, 'error', 'Vocha imeisha muda');
  end if;

  -- Mark used (idempotency guard: only if still unused).
  update public.vouchers
     set status = 'used', used_at = now(), used_by = coalesce(p_mac, used_by)
   where id = _voucher.id and status = 'unused';

  select * into _pkg from public.packages where id = _voucher.package_id;

  -- Try to enqueue a hotspot activation on a router in the same company.
  -- The agent creates a hotspot user (code) bound to the package profile.
  select id into _router from public.routers
   where company_id = _company and is_active
   order by (status = 'online') desc, created_at asc
   limit 1;

  if _router is not null then
    insert into public.router_commands (router_id, company_id, command, params, status)
    values (
      _router, _company, 'hotspot.create_user',
      jsonb_build_object(
        'name', _voucher.code,
        'password', _voucher.code,
        'profile', coalesce(_pkg.router_profile, 'default')
      ),
      'pending'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', _voucher.code,
    'package', coalesce(_pkg.name, null),
    'activated', _router is not null
  );
end;
$redeem$;

grant execute on function public.portal_redeem_voucher(text, text, text) to anon;

-- ---------- RLS (admin-managed tables) ------------------------------
alter table public.portal_settings       enable row level security;
alter table public.portal_ads            enable row level security;
alter table public.portal_offers         enable row level security;
alter table public.portal_announcements  enable row level security;

-- Admin read/write within their company. Public read is via get_portal().
do $portalrls$
declare t text;
begin
  foreach t in array array['portal_settings','portal_ads','portal_offers','portal_announcements'] loop
    execute format($p$
      drop policy if exists %1$s_select on public.%1$s;
      create policy %1$s_select on public.%1$s
        for select using (company_id = public.current_company_id());
      drop policy if exists %1$s_write on public.%1$s;
      create policy %1$s_write on public.%1$s
        for all using (company_id = public.current_company_id() and public.is_company_admin())
        with check (company_id = public.current_company_id());
    $p$, t);
  end loop;
end;
$portalrls$;

-- Backfill portal settings for existing companies.
do $backfill$
declare c record;
begin
  for c in select id from public.companies loop
    perform public.ensure_portal_settings(c.id);
  end loop;
end;
$backfill$;


-- #####################################################################
-- FROM: 0016_router_logs.sql
-- #####################################################################

-- =====================================================================
-- PHASE 8A-fix — ROUTER LOGS
-- Agent-visible logs written to DB so admins see connection lifecycle
-- from the dashboard (not just the agent terminal).
-- Dollar-quotes: unique tags.
-- =====================================================================

create table if not exists public.router_logs (
  id           bigint generated always as identity primary key,
  company_id   uuid not null references public.companies(id) on delete cascade,
  router_id    uuid references public.routers(id) on delete cascade,
  agent_id     uuid references public.router_agents(id) on delete set null,
  level        text not null default 'info',   -- debug|info|warn|error
  scope        text,                            -- e.g. 'router-api','poll'
  message      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_router_logs_router on public.router_logs(router_id, created_at desc);
create index if not exists idx_router_logs_company on public.router_logs(company_id, created_at desc);

-- Keep only the most recent logs (auto-prune older than 7 days) on insert bursts.
create or replace function public.prune_router_logs()
returns void language plpgsql security definer set search_path = public
as $prunelogs$
begin
  delete from public.router_logs where created_at < now() - interval '7 days';
end;
$prunelogs$;

-- ---------- RLS ------------------------------------------------------
alter table public.router_logs enable row level security;

drop policy if exists router_logs_select on public.router_logs;
create policy router_logs_select on public.router_logs
  for select using (company_id = public.current_company_id());

-- Inserts happen via the agent-gateway (service role) only.

-- ---------- Realtime -------------------------------------------------
do $rt$
begin
  begin
    alter publication supabase_realtime add table public.router_logs;
  exception when duplicate_object then null; end;
end;
$rt$;


-- #####################################################################
-- FROM: 0017_credential_read_fix.sql
-- #####################################################################

-- =====================================================================
-- FIX: Router credential READ path.
-- Root cause: the agent-gateway read `vault.decrypted_secrets` directly via
-- PostgREST, but the `vault` schema is NOT exposed to the API — so the read
-- returned NULL and the agent received an empty password ("invalid password").
--
-- Solution: a SECURITY DEFINER RPC that reads the decrypted secret inside the
-- database (where vault IS reachable) and returns it. Callable by service_role
-- only (used by the Edge Function), never by anon/authenticated clients.
-- Dollar-quotes: unique tags.
-- =====================================================================

create or replace function public.get_router_password(p_router_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $getrouterpw$
declare
  _secret_id uuid;
  _password  text;
begin
  select secret_id into _secret_id
    from public.router_credentials
   where router_id = p_router_id;

  if _secret_id is null then
    return null;
  end if;

  -- vault.decrypted_secrets is reachable here (definer context), not via API.
  select decrypted_secret into _password
    from vault.decrypted_secrets
   where id = _secret_id;

  return _password;
end;
$getrouterpw$;

-- Only the service role (Edge Functions) may read decrypted passwords.
revoke all on function public.get_router_password(uuid) from public, anon, authenticated;
grant execute on function public.get_router_password(uuid) to service_role;

-- Same fix for Omada controllers (same root cause).
create or replace function public.get_omada_password(p_controller_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $getomadapw$
declare
  _secret_id uuid;
  _password  text;
begin
  select secret_id into _secret_id
    from public.omada_credentials
   where controller_id = p_controller_id;

  if _secret_id is null then
    return null;
  end if;

  select decrypted_secret into _password
    from vault.decrypted_secrets
   where id = _secret_id;

  return _password;
end;
$getomadapw$;

revoke all on function public.get_omada_password(uuid) from public, anon, authenticated;
grant execute on function public.get_omada_password(uuid) to service_role;

-- ---------- Cleanup: drop obsolete plaintext-era columns -------------
-- password_enc predates the Vault migration and is always NULL now. Removing
-- it prevents confusion about where credentials live (answer: Vault only).
alter table public.router_credentials drop column if exists password_enc;

