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
