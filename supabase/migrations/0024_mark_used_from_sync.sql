-- =====================================================================
-- Auto-detect used vouchers from MikroTik usage.
-- ADDITIVE ONLY — one SECURITY DEFINER RPC. Does NOT touch MikroTik config.
--
-- A voucher's code equals its hotspot user name on the router. When that user
-- has consumed time or data (uptime/bytes > 0), the voucher has been used. This
-- RPC reads the agent's cached hotspot.users sync payload and marks matching
-- vouchers as 'used' (only those still 'unused', so it's idempotent and never
-- overwrites an existing used_at).
--
-- Called by the agent gateway after each hotspot.users sync (service role), so
-- reports reflect real usage even when customers log in directly on the router.
-- =====================================================================

create or replace function public.mark_used_from_sync(p_router_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $markused$
declare
  _company   uuid;
  _payload   jsonb;
  _marked    integer := 0;
begin
  -- Company that owns this router.
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null then
    return 0;
  end if;

  -- Latest hotspot.users payload cached by the agent for this router.
  select payload into _payload
    from public.router_sync_data
   where router_id = p_router_id and kind = 'hotspot.users';
  if _payload is null then
    return 0;
  end if;

  -- Mark unused vouchers used when their code matches a hotspot user that has
  -- consumed uptime or data. Uses the JSON array from the sync cache.
  with used_names as (
    select u->>'name' as name
      from jsonb_array_elements(_payload) as u
     where coalesce(u->>'uptime', '') not in ('', '00:00:00')
        or coalesce((u->>'bytes-in')::bigint, 0) > 0
        or coalesce((u->>'bytes-out')::bigint, 0) > 0
  )
  update public.vouchers v
     set status = 'used', used_at = now()
    from used_names n
   where v.company_id = _company
     and v.code = n.name
     and v.status = 'unused';

  get diagnostics _marked = row_count;
  return _marked;
end;
$markused$;
