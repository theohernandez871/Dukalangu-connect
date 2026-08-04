import { useState } from 'react';
import { PencilSquareIcon, TrashIcon, ServerStackIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { RouterStatusBadge } from './RouterStatusBadge';
import { RouterFormDialog } from './RouterFormDialog';
import { RouterTestButton } from './RouterTestButton';
import { useRouters, useRouterMutations } from '../hooks/useRouters';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { timeAgo } from '@/utils/currency';
import type { Router } from '../types/router';
import type { Column } from '@/components/data/dataTable.types';

export function RouterList() {
  const { data, isLoading, isError, refetch } = useRouters();
  const { remove } = useRouterMutations();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');

  const [editing, setEditing] = useState<Router | null>(null);
  const [deleting, setDeleting] = useState<Router | null>(null);

  const columns: Column<Router>[] = [
    {
      key: 'name',
      header: 'Router',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <ServerStackIcon className="h-4 w-4 text-slate-400" />
          <div className="min-w-0">
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-slate-400">
              {r.connectionType === 'agent' ? 'Agent' : `${r.host ?? '—'}:${r.apiPort}`}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'branch', header: 'Tawi', hideOnMobile: true, cell: (r) => r.branchName ?? '—' },
    { key: 'status', header: 'Hali', cell: (r) => <RouterStatusBadge status={r.status} /> },
    {
      key: 'os',
      header: 'RouterOS',
      hideOnMobile: true,
      cell: (r) => (r.osVersion ? <Badge tone="neutral">{r.osVersion}</Badge> : '—'),
    },
    {
      key: 'seen',
      header: 'Iliyoonekana',
      hideOnMobile: true,
      align: 'right',
      cell: (r) => <span className="text-slate-400">{r.lastSeen ? timeAgo(r.lastSeen) : 'Kamwe'}</span>,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna router"
        emptyDescription="Ongeza router yako ya kwanza ili kuanza."
        actions={
          canManage
            ? (r) => (
                <div className="flex justify-end gap-1">
                  <RouterTestButton routerId={r.id} />
                  <Button variant="ghost" size="sm" onClick={() => setEditing(r)} aria-label="Hariri">
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(r)} aria-label="Futa">
                    <TrashIcon className="h-4 w-4 text-danger-600" />
                  </Button>
                </div>
              )
            : undefined
        }
      />

      <RouterFormDialog open={!!editing} onClose={() => setEditing(null)} router={editing} />
      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={remove.isPending}
        message={`Una uhakika unataka kufuta router "${deleting?.name}"? Hii itaondoa pia siri zake.`}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
