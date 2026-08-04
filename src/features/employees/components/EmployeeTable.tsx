import { DataTable } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmployeeRoleBadge } from './EmployeeRoleBadge';
import { EmployeeActionsMenu } from './EmployeeActionsMenu';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Employee } from '../types/employee';
import type { Column } from '@/components/data/dataTable.types';

export function EmployeeTable() {
  const { data, isLoading, isError, refetch } = useEmployees();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employee:manage');

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Mfanyakazi',
      cell: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.fullName || e.email} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{e.fullName || '—'}</p>
            <p className="truncate text-xs text-slate-400">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Jukumu', cell: (e) => <EmployeeRoleBadge role={e.role} /> },
    { key: 'branch', header: 'Tawi', hideOnMobile: true, cell: (e) => e.branchName ?? '—' },
    {
      key: 'status',
      header: 'Hali',
      cell: (e) => (
        <Badge tone={e.isActive ? 'success' : 'neutral'}>{e.isActive ? 'Hai' : 'Imezimwa'}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      rowKey={(e) => e.id}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      emptyTitle="Hakuna wafanyakazi"
      emptyDescription="Alika mfanyakazi wako wa kwanza."
      actions={canManage ? (e) => <EmployeeActionsMenu employee={e} /> : undefined}
    />
  );
}
