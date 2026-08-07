-- =====================================================================
-- PHASE 2 / Module 1: Package validity.
-- ADDITIVE ONLY — adds one nullable column. Does not touch existing columns,
-- constraints, data, or the vouchers relationship. Safe to run repeatedly.
--
-- validity_days = how many days a voucher stays usable AFTER it is sold/
-- generated. NULL = no validity limit (uses whatever the voucher sets).
-- =====================================================================

alter table public.packages
  add column if not exists validity_days integer;

comment on column public.packages.validity_days is
  'Siku ambazo voucher inabaki hai baada ya kununuliwa (NULL = hakuna kikomo).';
