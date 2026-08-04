import { useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { BranchFormDialog } from './BranchFormDialog';
import { useBranches, useBranchMutations } from '../hooks/useCompany';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Branch } from '../types/company';
import type { Column } from '@/components/data/dataTable.types';

export function BranchList() {
  const { data, isLoading, isError, refetch } = useBranches();
  const { remove } = useBranchMutations();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('branch:manage') || hasPermission('company:manage');

  const [editing, setEditing] = useState<Branch | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  const columns: Column<Branch>[] = [
    {
      key: 'name',
      header: 'Tawi',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{b.name}</span>
          {b.isHq && <Badge tone="primary">HQ</Badge>}
        </div>
      ),
    },
    { key: 'location', header: 'Eneo', hideOnMobile: true, cell: (b) => b.location ?? '—' },
    { key: 'phone', header: 'Simu', hideOnMobile: true, cell: (b) => b.phone ?? '—' },
    { key: 'manager', header: 'Meneja', hideOnMobile: true, cell: (b) => b.managerName ?? '—' },
    {
      key: 'status',
      header: 'Hali',
      cell: (b) => <Badge tone={b.isActive ? 'success' : 'neutral'}>{b.isActive ? 'Hai' : 'Imezimwa'}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" /> Ongeza tawi
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna matawi"
        emptyDescription="Ongeza tawi lako la kwanza."
        actions={
          canManage
            ? (b) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(b)} aria-label="Hariri">
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  {!b.isHq && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(b)} aria-label="Futa">
                      <TrashIcon className="h-4 w-4 text-danger-600" />
                    </Button>
                  )}
                </div>
              )
            : undefined
        }
      />

      <BranchFormDialog open={creating} onClose={() => setCreating(false)} />
      <BranchFormDialog open={!!editing} onClose={() => setEditing(null)} branch={editing} />
      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={remove.isPending}
        message={`Una uhakika unataka kufuta tawi "${deleting?.name}"?`}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
