import { ClockIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useRecentActivity } from '../hooks/useDashboard';
import { actionLabel } from '../constants/actionLabels';
import { timeAgo } from '@/utils/currency';

export function RecentActivity() {
  const { data, isLoading, isError, refetch } = useRecentActivity();

  return (
    <Card>
      <CardHeader title="Shughuli za hivi karibuni" subtitle="Kutoka kumbukumbu za mfumo" />

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState icon={ClockIcon} title="Hakuna shughuli bado" />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ul className="space-y-1">
          {data.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
              <Avatar name={entry.actorName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">{entry.actorName}</span>{' '}
                  {actionLabel(entry.action)}
                </p>
                <p className="text-xs text-slate-400">{timeAgo(entry.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
