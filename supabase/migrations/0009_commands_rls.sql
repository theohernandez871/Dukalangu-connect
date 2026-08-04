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
