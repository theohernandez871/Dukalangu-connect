-- =====================================================================
-- Payouts / withdrawals LOG (record-keeping only).
-- ADDITIVE ONLY — new table + one balance RPC.
--
-- IMPORTANT: this does NOT move real money. Real funds sit in the Snippe
-- account and are withdrawn from there. This table only RECORDS payouts the
-- owner has already made, so they can track: revenue vs withdrawn vs remaining.
-- =====================================================================

create table if not exists public.payouts (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  amount       integer not null check (amount > 0),   -- TZS
  destination  text,                                   -- e.g. "M-Pesa 0712...", "Bank"
  note         text,
  paid_at      date not null default current_date,     -- when the owner withdrew
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_payouts_company on public.payouts(company_id, paid_at desc);

-- RLS: only members with payment permissions read; only managers/owners write.
alter table public.payouts enable row level security;

drop policy if exists payouts_select on public.payouts;
create policy payouts_select on public.payouts
  for select using (company_id = public.current_company_id());

drop policy if exists payouts_insert on public.payouts;
create policy payouts_insert on public.payouts
  for insert with check (company_id = public.current_company_id());

drop policy if exists payouts_delete on public.payouts;
create policy payouts_delete on public.payouts
  for delete using (company_id = public.current_company_id());

-- Balance summary: total revenue (completed payments) vs total withdrawn vs
-- remaining. All scoped to the caller's company.
create or replace function public.payout_balance()
returns table (
  total_revenue   bigint,
  total_withdrawn bigint,
  remaining       bigint
)
language plpgsql
stable
security definer
set search_path = public
as $payoutbalance$
declare
  v_company uuid := public.current_company_id();
  _revenue bigint;
  _withdrawn bigint;
begin
  select coalesce(sum(amount), 0) into _revenue
    from public.payment_transactions
   where company_id = v_company and status = 'completed';

  select coalesce(sum(amount), 0) into _withdrawn
    from public.payouts
   where company_id = v_company;

  return query select _revenue, _withdrawn, (_revenue - _withdrawn);
end;
$payoutbalance$;
