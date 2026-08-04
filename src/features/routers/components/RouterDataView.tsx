import type { ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { PendingAgentState } from './PendingAgentState';
import { useRouterQuery } from '../hooks/useRouterQuery';
import type { RouterCommandKey } from '../constants/commandCatalog';
import type { Column } from '@/components/data/dataTable.types';

interface RouterDataViewProps<T> {
  routerId: string;
  command: RouterCommandKey;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  emptyTitle: string;
  actions?: (row: T) => ReactNode;
}

/**
 * One component for every read-only RouterOS list: runs the command,
 * handles loading/pending/error, and renders the rows in a DataTable.
 */
export function RouterDataView<T>({
  routerId,
  command,
  columns,
  rowKey,
  emptyTitle,
  actions,
}: RouterDataViewProps<T>) {
  const { data, isLoading, isError, error, pending, refetch } = useRouterQuery<T[]>(
    routerId,
    command,
  );

  if (pending) return <PendingAgentState onRetry={refetch} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={refetch} disabled={isLoading}>
          <ArrowPathIcon className="h-4 w-4" /> Onyesha upya
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={rowKey}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle={isError ? (error ?? 'Hitilafu') : emptyTitle}
        actions={actions}
      />
    </div>
  );
}
