import { useRouterLogs } from '../hooks/useRouterLogs';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

const LEVEL_COLOR: Record<string, string> = {
  debug: 'text-slate-400',
  info: 'text-slate-600 dark:text-slate-300',
  warn: 'text-amber-600',
  error: 'text-red-600',
};

/** Live agent logs for a router (from router_logs, via Realtime). */
export function RouterLogsTab({ routerId }: { routerId: string }) {
  const { data, isLoading } = useRouterLogs(routerId);

  if (isLoading) return <Skeleton className="h-72" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Hakuna logs bado"
        description="Agent ikianza kufanya kazi, logs zake zitaonekana hapa moja kwa moja."
      />
    );
  }

  return (
    <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-900/50">
      {data.map((l) => (
        <div key={l.id} className="flex gap-2 py-0.5">
          <span className="shrink-0 text-slate-400">{new Date(l.created_at).toLocaleTimeString('sw-TZ')}</span>
          <span className={'shrink-0 font-semibold uppercase ' + (LEVEL_COLOR[l.level] ?? '')}>{l.level}</span>
          {l.scope && <span className="shrink-0 text-slate-400">({l.scope})</span>}
          <span className={LEVEL_COLOR[l.level] ?? ''}>{l.message}</span>
        </div>
      ))}
    </div>
  );
}
