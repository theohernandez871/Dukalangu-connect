import { supabase } from '@/lib/supabase';
import type { ActivityQuery } from '../types/activity';

export const activityRepository = {
  list({ page, pageSize, action }: ActivityQuery) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('audit_logs')
      .select('id, action, actor_id, metadata, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (action) query = query.eq('action', action);
    return query;
  },

  getActorNames(ids: string[]) {
    return supabase.from('profiles').select('id, full_name, email').in('id', ids);
  },
};
