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
