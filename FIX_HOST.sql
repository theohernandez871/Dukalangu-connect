-- =====================================================================
-- FIX: Routers zilizoundwa kabla ya rekebisho zina host = NULL.
-- Endesha kwenye Supabase SQL Editor kuona/kusasisha.
-- =====================================================================

-- 1. Ona routers zenye host tupu (hizi ndizo zinazoshindwa kuunganisha):
select id, name, host, api_port, connection_type, status
from public.routers
where host is null or host = '';

-- 2. Sasisha router yako kuweka IP sahihi.
--    BADILISHA 'JINA_LA_ROUTER' na jina lako, na IP kama inavyohitajika.
update public.routers
   set host = '192.168.88.1',
       api_port = 8728
 where (host is null or host = '')
   and name = 'JINA_LA_ROUTER';

-- 3. Thibitisha:
select id, name, host, api_port from public.routers;
