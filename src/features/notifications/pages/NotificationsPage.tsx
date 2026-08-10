import { useState } from 'react';
import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useNotifications, useNotificationActions } from '../hooks/useNotifications';
import { timeAgo } from '@/utils/currency';
import type { AppNotification, NotificationType } from '../types/notification';

const ICONS: Record<NotificationType, typeof BellAlertIcon> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

const ICON_TONE: Record<NotificationType, string> = {
  info: 'text-sky-500 bg-sky-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  error: 'text-red-500 bg-red-500/10',
};

function NotificationRow({ n, onRead }: { n: AppNotification; onRead: (id: number) => void }) {
  const Icon = ICONS[n.type] ?? InformationCircleIcon;
  return (
    <button
      type="button"
      onClick={() => !n.isRead && onRead(n.id)}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
        n.isRead
          ? 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
          : 'border-primary-200 bg-primary-50/50 dark:border-primary-900/40 dark:bg-primary-900/10'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[n.type]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
          {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
        </div>
        {n.body && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.body}</p>}
        <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
      </div>
    </button>
  );
}

export function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading } = useNotifications(filter === 'unread');
  const { markRead, markAllRead } = useNotificationActions();

  const items = data ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader title="Arifa" subtitle={unread > 0 ? `${unread} ambazo hazijasomwa` : 'Zote zimesomwa'} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="w-40">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Zote' },
              { value: 'unread', label: 'Hazijasomwa' },
            ]}
          />
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Soma zote
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Hakuna arifa"
          description="Arifa za mfumo (malipo, hali ya agent, na zaidi) zitaonekana hapa."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <NotificationRow key={n.id} n={n} onRead={(id) => markRead.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
