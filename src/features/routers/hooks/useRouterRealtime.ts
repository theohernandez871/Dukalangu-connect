import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { routerService } from '../services/router.service';

/**
 * Subscribe to Postgres changes on `routers` (and sync data) via Supabase
 * Realtime. When the agent's heartbeat updates a router row, the dashboard
 * refreshes instantly — no polling from the browser.
 */
export function useRouterRealtime() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId;

  useEffect(() => {
    if (!companyId) return;

    // Fallback offline detection when pg_cron isn't available (Hobby plan):
    // sweep stale routers on mount and every 60s while the page is open.
    void routerService.sweepOffline();
    const sweep = setInterval(() => void routerService.sweepOffline(), 60000);

    const channel = supabase
      .channel(`routers:${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routers', filter: `company_id=eq.${companyId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['routers', companyId] });
          qc.invalidateQueries({ queryKey: ['router'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'router_sync_data', filter: `company_id=eq.${companyId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['router-sync'] });
        },
      )
      .subscribe();

    return () => {
      clearInterval(sweep);
      void supabase.removeChannel(channel);
    };
  }, [companyId, qc]);
}
