-- =====================================================================
-- PHASE 2 / Module 5 FIX: count sales by USE, not by creation.
-- ADDITIVE (replaces function bodies only; no schema change).
--
-- "Sales/revenue" now = vouchers that were USED (a customer logged in),
-- measured by used_at. A batch of unsold vouchers no longer inflates revenue.
-- Total revenue also counts only used vouchers. Counts of total/used/unused
-- vouchers are unchanged.
-- =====================================================================

create or replace function public.get_voucher_reports(p_branch_id uuid default null)
returns table (
  sales_today_count    bigint,
  sales_today_revenue  numeric,
  sales_week_count     bigint,
  sales_week_revenue   numeric,
  sales_month_count    bigint,
  sales_month_revenue  numeric,
  total_vouchers       bigint,
  used_vouchers        bigint,
  unused_vouchers      bigint,
  total_revenue        numeric
)
language plpgsql
stable
security definer
set search_path = public
as $voucherreports2$
declare
  v_company uuid := public.current_company_id();
begin
  return query
  with v as (
    select vo.*, coalesce(pk.price, 0) as price
      from public.vouchers vo
      left join public.packages pk on pk.id = vo.package_id
     where vo.company_id = v_company
       and (p_branch_id is null or vo.branch_id = p_branch_id)
  )
  select
    -- Sales = used vouchers, dated by used_at.
    count(*) filter (where used_at::date = current_date),
    coalesce(sum(price) filter (where used_at::date = current_date), 0),
    count(*) filter (where used_at >= date_trunc('week', now())),
    coalesce(sum(price) filter (where used_at >= date_trunc('week', now())), 0),
    count(*) filter (where used_at >= date_trunc('month', now())),
    coalesce(sum(price) filter (where used_at >= date_trunc('month', now())), 0),
    -- Inventory counts (unchanged).
    count(*),
    count(*) filter (where status = 'used'),
    count(*) filter (where status = 'unused'),
    -- Total revenue = all used vouchers ever.
    coalesce(sum(price) filter (where status = 'used'), 0)
  from v;
end;
$voucherreports2$;

-- Branch breakdown: revenue counts only used vouchers, to match the cards.
create or replace function public.get_branch_reports()
returns table (
  branch_id       uuid,
  branch_name     text,
  voucher_count   bigint,
  used_count      bigint,
  revenue         numeric
)
language plpgsql
stable
security definer
set search_path = public
as $branchreports2$
declare
  v_company uuid := public.current_company_id();
begin
  return query
  select
    b.id,
    b.name,
    count(vo.id),
    count(vo.id) filter (where vo.status = 'used'),
    coalesce(sum(coalesce(pk.price, 0)) filter (where vo.status = 'used'), 0)
  from public.branches b
  left join public.vouchers vo on vo.branch_id = b.id and vo.company_id = v_company
  left join public.packages pk on pk.id = vo.package_id
  where b.company_id = v_company
  group by b.id, b.name
  order by revenue desc;
end;
$branchreports2$;
