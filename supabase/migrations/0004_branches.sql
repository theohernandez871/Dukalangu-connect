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
