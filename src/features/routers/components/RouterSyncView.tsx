import type { ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useRouterSync } from '../hooks/useRouterSync';
import { useRouterCommand } from '../hooks/useRouterCommand';
import type { Column } from '@/components/data/dataTable.types';

interface RouterSyncViewProps<T> {
  routerId: string;
  kind: string;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  emptyTitle: string;
  actions?: (row: T) => ReactNode;
}

/**
 * Displays a kind of RouterOS data from the agent's sync cache. Data arrives
 * in real time (Supabase Realtime); "Sync sasa" forces the agent to refresh.
 */
export function RouterSyncView<T>({ routerId, kind, columns, rowKey, emptyTitle, actions }: RouterSyncViewProps<T>) {
  const { rows, syncedAt, isLoading, isError, refetch } = useRouterSync<T>(routerId, kind);
  const { send, sending } = useRouterCommand();

  const forceSync = async () => {
    await send(routerId, 'sync.all');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {syncedAt ? `Imesasishwa: ${new Date(syncedAt).toLocaleTimeString('sw-TZ')}` : 'Bado haijasasishwa'}
        </p>
        <Button variant="secondary" size="sm" isLoading={sending === 'sync.all'} onClick={forceSync}>
          <ArrowPathIcon className="h-4 w-4" /> Sync sasa
        </Button>
      </div>

      {!syncedAt && !isLoading ? (
        <EmptyState
          title="Inasubiri agent"
          description="Data itaonekana mara agent itakaposawazisha router hii. Bonyeza 'Sync sasa'."
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={rowKey}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyTitle={emptyTitle}
          actions={actions}
        />
      )}
    </div>
  );
}
