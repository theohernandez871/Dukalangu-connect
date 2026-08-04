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
