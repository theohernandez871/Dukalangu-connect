import { supabase } from '@/lib/supabase';
import type { AppNotification, NotificationType } from '../types/notification';

interface Row {
  id: number;
  title: string;
  body: string | null;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

function mapRow(r: Row): AppNotification {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    type: r.type,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}

export const notificationService = {
  async list(unreadOnly = false): Promise<AppNotification[]> {
    let q = supabase
      .from('notifications')
      .select('id, title, body, type, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (unreadOnly) q = q.eq('is_read', false);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Row[]).map(mapRow);
  },

  async markRead(id: number): Promise<void> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllRead(): Promise<void> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
  },
};
