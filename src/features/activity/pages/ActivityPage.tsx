import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { Pagination } from '@/components/data/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { ActivityFilters } from '../components/ActivityFilters';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { actionLabel } from '@/constants/actionLabels';
import { timeAgo } from '@/utils/currency';
import type { ActivityLog } from '../types/activity';
import type { Column } from '@/components/data/dataTable.types';

export function ActivityPage() {
  const { data, isLoading, isError, refetch, page, setPage, action, changeFilter, pageSize } =
    useActivityLogs();

  const columns: Column<ActivityLog>[] = [
    {
      key: 'actor',
      header: 'Mtumiaji',
      cell: (log) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={log.actorName} size="sm" />
          <span className="font-medium">{log.actorName}</span>
        </div>
      ),
    },
    { key: 'action', header: 'Kitendo', cell: (log) => actionLabel(log.action) },
    {
      key: 'time',
      header: 'Muda',
      hideOnMobile: true,
      align: 'right',
      cell: (log) => <span className="text-slate-400">{timeAgo(log.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Kumbukumbu za shughuli" subtitle="Matukio yote ya mfumo" />
      <div className="mb-4">
        <ActivityFilters value={action} onChange={changeFilter} />
      </div>
      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        rowKey={(log) => log.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna kumbukumbu"
      />
      {data && data.total > pageSize && (
        <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
