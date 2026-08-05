-- =====================================================================
-- PHASE 7 — VOUCHER MANAGEMENT
-- Numeric codes (keypad-friendly). Batches group vouchers.
-- generate_vouchers() creates many unique codes atomically.
-- Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Enum -----------------------------------------------------
do $vchenum$
begin
  if not exists (select 1 from pg_type where typname = 'voucher_status') then
    create type public.voucher_status as enum ('unused', 'used', 'expired', 'disabled');
  end if;
end;
$vchenum$;

-- ---------- Voucher batches ------------------------------------------
create table if not exists public.voucher_batches (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  branch_id    uuid references public.branches(id) on delete set null,
  package_id   uuid references public.packages(id) on delete set null,
  count        integer not null default 0,
  prefix       text,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_batches_company on public.voucher_batches(company_id);

-- ---------- Vouchers -------------------------------------------------
create table if not exists public.vouchers (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  batch_id     uuid references public.voucher_batches(id) on delete cascade,
  package_id   uuid references public.packages(id) on delete set null,
  code         text not null,
  status       public.voucher_status not null default 'unused',
  used_at      timestamptz,
  used_by      text,                       -- device MAC / identifier (Phase 8)
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (company_id, code)
);

create index if not exists idx_vouchers_company on public.vouchers(company_id, status);
create index if not exists idx_vouchers_batch on public.vouchers(batch_id);
create index if not exists idx_vouchers_code on public.vouchers(company_id, code);

-- ---------- Generate a batch of numeric vouchers --------------------
-- Returns the new batch_id. Codes are numeric, `p_length` digits,
-- optionally grouped for display client-side.
create or replace function public.generate_vouchers(
  p_package_id uuid,
  p_count      integer,
  p_length     integer default 8,
  p_prefix     text default null,
  p_notes      text default null,
  p_branch_id  uuid default null,
  p_valid_days integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $genvouchers$
declare
  _company   uuid := public.current_company_id();
  _batch_id  uuid;
  _code      text;
  _made      integer := 0;
  _attempts  integer := 0;
  _expires   timestamptz;
begin
  if _company is null then
    raise exception 'Haujaidhinishwa';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','company_owner','branch_manager','sales_agent')
  ) then
    raise exception 'Hauna ruhusa ya kutengeneza vocha';
  end if;
  if p_count < 1 or p_count > 1000 then
    raise exception 'Idadi lazima iwe kati ya 1 na 1000';
  end if;

  if p_valid_days is not null then
    _expires := now() + (p_valid_days || ' days')::interval;
  end if;

  insert into public.voucher_batches (company_id, branch_id, package_id, count, prefix, notes, created_by)
  values (_company, p_branch_id, p_package_id, p_count, p_prefix, p_notes, auth.uid())
  returning id into _batch_id;

  while _made < p_count and _attempts < p_count * 20 loop
    _attempts := _attempts + 1;
    -- Random numeric string of p_length digits.
    _code := lpad((floor(random() * (10::numeric ^ p_length)))::bigint::text, p_length, '0');
    if p_prefix is not null and p_prefix <> '' then
      _code := p_prefix || _code;
    end if;

    begin
      insert into public.vouchers (company_id, batch_id, package_id, code, expires_at)
      values (_company, _batch_id, p_package_id, _code, _expires);
      _made := _made + 1;
    exception when unique_violation then
      -- Collision: try another code.
      null;
    end;
  end loop;

  update public.voucher_batches set count = _made where id = _batch_id;

  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (_company, auth.uid(), 'voucher.batch_create',
          jsonb_build_object('count', _made, 'batch', _batch_id));

  return _batch_id;
end;
$genvouchers$;

-- ---------- RLS ------------------------------------------------------
alter table public.voucher_batches enable row level security;
alter table public.vouchers        enable row level security;

drop policy if exists batches_select on public.voucher_batches;
create policy batches_select on public.voucher_batches
  for select using (company_id = public.current_company_id());

drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers
  for select using (company_id = public.current_company_id());

-- Disabling/enabling individual vouchers by admins.
drop policy if exists vouchers_update on public.vouchers;
create policy vouchers_update on public.vouchers
  for update using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

-- Deleting a batch (cascades to its vouchers) by admins.
drop policy if exists batches_delete on public.voucher_batches;
create policy batches_delete on public.voucher_batches
  for delete using (company_id = public.current_company_id() and public.is_company_admin());

-- Inserts happen only via generate_vouchers() (SECURITY DEFINER).
