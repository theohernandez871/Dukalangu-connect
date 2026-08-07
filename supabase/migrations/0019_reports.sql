-- =====================================================================
-- PHASE 2 / Module 5: Voucher & sales reports.
-- ADDITIVE ONLY — one new SECURITY DEFINER function. No table/column changes.
--
-- Revenue model: each voucher represents a sale of its package, so revenue for
-- a period = SUM(package.price) over vouchers CREATED in that period. Used
-- vouchers are counted by status='used'. All figures are scoped to the caller's
-- company via current_company_id(), and optionally filtered by branch.
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
as $voucherreports$
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
    count(*) filter (where created_at::date = current_date),
    coalesce(sum(price) filter (where created_at::date = current_date), 0),
    count(*) filter (where created_at >= date_trunc('week', now())),
    coalesce(sum(price) filter (where created_at >= date_trunc('week', now())), 0),
    count(*) filter (where created_at >= date_trunc('month', now())),
    coalesce(sum(price) filter (where created_at >= date_trunc('month', now())), 0),
    count(*),
    count(*) filter (where status = 'used'),
    count(*) filter (where status = 'unused'),
    coalesce(sum(price), 0)
  from v;
end;
$voucherreports$;

-- Per-branch breakdown (revenue + counts) for the current company.
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
as $branchreports$
declare
  v_company uuid := public.current_company_id();
begin
  return query
  select
    b.id,
    b.name,
    count(vo.id),
    count(vo.id) filter (where vo.status = 'used'),
    coalesce(sum(coalesce(pk.price, 0)), 0)
  from public.branches b
  left join public.vouchers vo on vo.branch_id = b.id and vo.company_id = v_company
  left join public.packages pk on pk.id = vo.package_id
  where b.company_id = v_company
  group by b.id, b.name
  order by revenue desc;
end;
$branchreports$;
