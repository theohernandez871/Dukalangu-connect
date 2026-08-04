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
