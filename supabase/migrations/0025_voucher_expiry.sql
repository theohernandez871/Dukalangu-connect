-- =====================================================================
-- Voucher validity: expire 14 hours after FIRST use (calendar time).
-- ADDITIVE ONLY — replaces mark_used_from_sync body + adds two RPCs. No schema
-- change (uses existing used_at / expires_at / status columns).
--
-- Business model: a voucher is "14 hours from first login" — once a customer
-- logs in, the clock runs on wall-clock time (even if they disconnect), which
-- maximises repurchase. When the window passes, the voucher's hotspot user is
-- DISABLED on the router (not deleted), so history is preserved.
--
-- No MikroTik config is touched: the agent disables the individual user via the
-- normal RouterOS API, exactly like the manual enable/disable already in use.
-- =====================================================================

-- Validity window, in hours, from first use.
create or replace function public.voucher_validity_hours()
returns integer language sql immutable as $vh$ select 14 $vh$;

-- 1) When marking vouchers used from sync, also stamp expires_at = now + 14h
--    (only if not already set), so the countdown starts at first login.
create or replace function public.mark_used_from_sync(p_router_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $markused2$
declare
  _company uuid;
  _payload jsonb;
  _marked  integer := 0;
begin
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null then return 0; end if;

  select payload into _payload
    from public.router_sync_data
   where router_id = p_router_id and kind = 'hotspot.users';
  if _payload is null then return 0; end if;

  with used_names as (
    select u->>'name' as name
      from jsonb_array_elements(_payload) as u
     where coalesce(u->>'uptime', '') not in ('', '00:00:00')
        or coalesce((u->>'bytes-in')::bigint, 0) > 0
        or coalesce((u->>'bytes-out')::bigint, 0) > 0
  )
  update public.vouchers v
     set status = 'used',
         used_at = now(),
         expires_at = coalesce(v.expires_at, now() + (public.voucher_validity_hours() || ' hours')::interval)
    from used_names n
   where v.company_id = _company
     and v.code = n.name
     and v.status = 'unused';

  get diagnostics _marked = row_count;
  return _marked;
end;
$markused2$;

-- 2) Return codes of vouchers whose validity has passed and are still 'used'
--    (i.e. not yet expired/disabled), for a given router's company. The agent
--    disables these users on the router, then calls expire_vouchers() to flip
--    their status.
create or replace function public.expired_voucher_codes(p_router_id uuid)
returns table (code text)
language plpgsql
stable
security definer
set search_path = public
as $expiredcodes$
declare
  _company uuid;
begin
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null then return; end if;

  return query
  select v.code
    from public.vouchers v
   where v.company_id = _company
     and v.status = 'used'
     and v.expires_at is not null
     and v.expires_at <= now();
end;
$expiredcodes$;

-- 3) Flip expired vouchers to 'expired' (called after the agent has disabled
--    the users on the router). Idempotent.
create or replace function public.expire_vouchers(p_router_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $expirevouchers$
declare
  _company uuid;
  _n integer := 0;
begin
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null then return 0; end if;

  update public.vouchers
     set status = 'expired'
   where company_id = _company
     and status = 'used'
     and expires_at is not null
     and expires_at <= now();

  get diagnostics _n = row_count;
  return _n;
end;
$expirevouchers$;
