import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilSquareIcon, TrashIcon, WifiIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { OmadaStatusBadge } from './OmadaStatusBadge';
import { OmadaFormDialog } from './OmadaFormDialog';
import { useControllers, useControllerMutations } from '../hooks/useOmada';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { OmadaController } from '../types/omada';
import type { Column } from '@/components/data/dataTable.types';

export function OmadaList() {
  const { data, isLoading, isError, refetch } = useControllers();
  const { remove } = useControllerMutations();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canManage = hasPermission('router:manage');

  const [editing, setEditing] = useState<OmadaController | null>(null);
  const [deleting, setDeleting] = useState<OmadaController | null>(null);

  const columns: Column<OmadaController>[] = [
    {
      key: 'name',
      header: 'Controller',
      cell: (c) => (
        <button
          onClick={() => navigate(`/tplink/${c.id}`)}
          className="flex items-center gap-2 text-left hover:text-primary-600"
        >
          <WifiIcon className="h-4 w-4 text-slate-400" />
          <div className="min-w-0">
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-slate-400">{c.baseUrl ?? 'Agent (local)'}</p>
          </div>
        </button>
      ),
    },
    {
      key: 'type',
      header: 'Aina',
      cell: (c) => <Badge tone={c.connectionType === 'cloud' ? 'info' : 'neutral'}>{c.connectionType === 'cloud' ? 'Cloud' : 'Local'}</Badge>,
    },
    { key: 'branch', header: 'Tawi', hideOnMobile: true, cell: (c) => c.branchName ?? '—' },
    { key: 'status', header: 'Hali', cell: (c) => <OmadaStatusBadge status={c.status} /> },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna controller"
        emptyDescription="Ongeza Omada controller yako ya kwanza."
        actions={
          canManage
            ? (c) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(c)} aria-label="Hariri">
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} aria-label="Futa">
                    <TrashIcon className="h-4 w-4 text-danger-600" />
                  </Button>
                </div>
              )
            : undefined
        }
      />

      <OmadaFormDialog open={!!editing} onClose={() => setEditing(null)} controller={editing} />
      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={remove.isPending}
        message={`Una uhakika unataka kufuta controller "${deleting?.name}"?`}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
