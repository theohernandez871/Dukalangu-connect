import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RouterLog {
  id: number;
  level: string;
  scope: string | null;
  message: string;
  created_at: string;
}

/** Read recent agent logs for a router, updated live via Realtime. */
export function useRouterLogs(routerId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['router-logs', routerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('router_logs')
        .select('id, level, scope, message, created_at')
        .eq('router_id', routerId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as RouterLog[];
    },
    enabled: !!routerId,
  });

  useEffect(() => {
    if (!routerId) return;
    const channel = supabase
      .channel(`router-logs:${routerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'router_logs', filter: `router_id=eq.${routerId}` },
        () => qc.invalidateQueries({ queryKey: ['router-logs', routerId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [routerId, qc]);

  return query;
}
