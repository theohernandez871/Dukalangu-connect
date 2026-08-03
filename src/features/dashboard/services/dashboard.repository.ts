import { supabase } from '@/lib/supabase';

export const dashboardRepository = {
  getStats() {
    return supabase.rpc('get_dashboard_stats');
  },

  getRecentActivity(limit = 8) {
    return supabase
      .from('audit_logs')
      .select('id, action, actor_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  getActorNames(ids: string[]) {
    return supabase.from('profiles').select('id, full_name, email').in('id', ids);
  },
};
