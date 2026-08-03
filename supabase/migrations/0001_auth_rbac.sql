-- =====================================================================
-- PHASE 1 — AUTHENTICATION & RBAC
-- Multi-tenant: shared DB, isolation by company_id + RLS.
-- Dollar-quoting uses $fn$ (never $$).
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
do $fn$
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
$fn$;

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
as $fn$
  select company_id from public.profiles where id = auth.uid();
$fn$;

-- ---------- Signup trigger: create company + owner profile -----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
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
$fn$;

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
as $fn$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null then
    update public.profiles
      set email_verified = true, updated_at = now()
      where id = new.id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_confirmed();
