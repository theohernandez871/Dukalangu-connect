import type { ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { useOmadaData } from '../hooks/useOmada';
import type { Column } from '@/components/data/dataTable.types';

interface OmadaDataViewProps<T> {
  controllerId: string;
  command: string;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  emptyTitle: string;
  /** Optional transform from raw Omada result to a row array. */
  select?: (raw: unknown) => T[];
  actions?: (row: T) => ReactNode;
}

/** One component for every read-only Omada list (devices, clients, etc). */
export function OmadaDataView<T>({
  controllerId,
  command,
  columns,
  rowKey,
  emptyTitle,
  select,
  actions,
}: OmadaDataViewProps<T>) {
  const { data, isLoading, isError, error, refetch } = useOmadaData<unknown>(controllerId, command);

  const rows: T[] = data ? (select ? select(data) : (data as T[])) : [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <ArrowPathIcon className="h-4 w-4" /> Onyesha upya
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        rowKey={rowKey}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle={isError ? ((error as Error)?.message ?? 'Hitilafu') : emptyTitle}
        actions={actions}
      />
    </div>
  );
}
