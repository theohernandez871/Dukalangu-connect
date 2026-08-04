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
