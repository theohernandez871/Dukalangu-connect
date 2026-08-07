-- =====================================================================
-- PHASE 3 / Module 3A: Payment transactions.
-- ADDITIVE ONLY — new table + indexes. Records every Snippe payment attempt,
-- its lifecycle, and links to the package/branch. The voucher is generated
-- later (Module 3B webhook) and its id stored back here once issued.
-- =====================================================================

create table if not exists public.payment_transactions (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  branch_id           uuid references public.branches(id) on delete set null,
  package_id          uuid references public.packages(id) on delete set null,

  -- Snippe references
  snippe_reference    text unique,              -- payment reference from Snippe
  external_reference  text,                      -- Snippe's external_reference
  idempotency_key     text unique,              -- our key sent to Snippe

  -- Money (store as integer TZS, matching Snippe's smallest unit)
  amount              integer not null,
  currency            text not null default 'TZS',

  -- Customer
  phone_number        text not null,
  customer_name       text,

  -- Lifecycle: pending -> completed / failed / voided / expired
  status              text not null default 'pending',
  failure_reason      text,

  -- Voucher issued after successful payment (Module 3B)
  voucher_id          uuid references public.vouchers(id) on delete set null,
  voucher_code        text,

  -- Routing target for voucher -> MikroTik (chosen at purchase time)
  router_id           uuid references public.routers(id) on delete set null,
  router_profile      text,

  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  updated_at          timestamptz not null default now()
);

create index if not exists idx_paytx_company on public.payment_transactions(company_id, status);
create index if not exists idx_paytx_snippe_ref on public.payment_transactions(snippe_reference);
create index if not exists idx_paytx_created on public.payment_transactions(company_id, created_at desc);

-- RLS: company members can read their own transactions. Writes happen only via
-- Edge Functions using the service role (which bypasses RLS), so no write
-- policy is granted to authenticated users.
alter table public.payment_transactions enable row level security;

drop policy if exists paytx_select on public.payment_transactions;
create policy paytx_select on public.payment_transactions
  for select using (company_id = public.current_company_id());
