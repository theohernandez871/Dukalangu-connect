-- =====================================================================
-- UCHUNGUZI: Kwa nini hotspot user haikuundwa kutoka voucher?
-- Endesha kila query kwenye Supabase SQL Editor uone iko wapi tatizo.
-- =====================================================================

-- 1. Je commands za create_voucher zilifika kwenye queue?
--    Kama HAKUNA rows: frontend haikutuma (toleo la zamani? router haikuchaguliwa?)
select id, router_id, command, status, params, error, created_at, finished_at
  from public.router_commands
 where command = 'hotspot.create_voucher'
 order by created_at desc
 limit 20;

-- 2. Hali ya commands hizo (pending/running/done/failed?)
--    pending    = agent haijazipokea (agent haiendeshi? router_id mbaya?)
--    running    = agent ilizipokea lakini haijamaliza
--    failed     = agent ilijaribu, MikroTik ikakataa (angalia 'error')
--    done       = zimefanikiwa (angalia MikroTik tena + Sync)
select status, count(*)
  from public.router_commands
 where command = 'hotspot.create_voucher'
 group by status;

-- 3. Kama zime-'failed', kosa halisi ni nini?
select id, params, error, finished_at
  from public.router_commands
 where command = 'hotspot.create_voucher'
   and status = 'failed'
 order by created_at desc
 limit 10;

-- 4. Je router uliyochagua ina agent inayoendesha (is_active)?
--    Badilisha JINA na jina la router yako ("mikcrotik main")
select r.id as router_id, r.name, r.host, r.status,
       a.id as agent_id, a.is_active, a.last_seen
  from public.routers r
  left join public.router_agents a
         on (a.router_id = r.id or a.router_id is null)
        and a.company_id = r.company_id
 where r.name ilike '%main%';

-- 5. Je vocha ziko kwenye batch (codes zipo)?
--    Chukua batch_id ya karibuni:
select b.id as batch_id, b.count, count(v.id) as codes
  from public.voucher_batches b
  left join public.vouchers v on v.batch_id = b.id
 group by b.id, b.count
 order by b.created_at desc
 limit 5;
