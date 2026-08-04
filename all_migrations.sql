-- =====================================================================
-- HOTSPOT BILLING SYSTEM — MIGRATIONS ZOTE (PHASE 1–5)
-- =====================================================================
-- Bandika faili hili LOTE kwenye Supabase SQL Editor kisha bonyeza RUN.
-- Ni salama kuendesha mara nyingi (idempotent).
-- Toleo: v6 (imeongeza Phase 5: Omada controllers + credentials).
-- MUHIMU: inahitaji "supabase_vault" na "pgcrypto" (SQL inaziwasha yenyewe).
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

