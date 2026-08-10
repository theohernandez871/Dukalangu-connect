import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useNotifications(unreadOnly = false) {
  const { session } = useAuth();
  const uid = session?.profile.id ?? '';
  return useQuery({
    queryKey: ['notifications', uid, unreadOnly ? 'unread' : 'all'],
    queryFn: () => notificationService.list(unreadOnly),
    enabled: !!uid,
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead };
}
