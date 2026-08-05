import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SyncRow {
  payload: unknown[];
  synced_at: string;
}

/**
 * Read a kind of RouterOS data from the sync cache the agent maintains.
 * Combined with useRouterRealtime, this updates live when the agent pushes
 * new data — no per-view command round-trip needed.
 */
export function useRouterSync<T = unknown>(routerId: string, kind: string) {
  const query = useQuery({
    queryKey: ['router-sync', routerId, kind],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('router_sync_data')
        .select('payload, synced_at')
        .eq('router_id', routerId)
        .eq('kind', kind)
        .maybeSingle();
      if (error) throw error;
      return (data as SyncRow) ?? null;
    },
    enabled: !!routerId,
  });

  return {
    rows: (query.data?.payload ?? []) as T[],
    syncedAt: query.data?.synced_at ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
