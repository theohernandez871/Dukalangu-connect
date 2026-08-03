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
