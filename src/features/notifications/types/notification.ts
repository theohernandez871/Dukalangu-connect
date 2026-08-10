export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: number;
  title: string;
  body: string | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
