import { useState } from 'react';
import { PlusIcon, SignalIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { AgentCreateDialog } from './AgentCreateDialog';
import { useAgents, useAgentMutations } from '../hooks/useAgents';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { timeAgo } from '@/utils/currency';
import type { RouterAgent } from '../types/agent';
import type { Column } from '@/components/data/dataTable.types';

/** An agent is "connected" if it pinged in the last 60 seconds. */
function isConnected(lastPing: string | null): boolean {
  if (!lastPing) return false;
  return Date.now() - new Date(lastPing).getTime() < 60_000;
}

export function AgentList() {
  const { data, isLoading, isError, refetch } = useAgents();
  const { revoke } = useAgentMutations();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');

  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<RouterAgent | null>(null);

  const columns: Column<RouterAgent>[] = [
    {
      key: 'name',
      header: 'Agent',
      cell: (a) => (
        <div className="flex items-center gap-2">
          <SignalIcon className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{a.name}</span>
        </div>
      ),
    },
    {
      key: 'conn',
      header: 'Muunganisho',
      cell: (a) =>
        isConnected(a.lastPing) ? (
          <Badge tone="success">Imeunganishwa</Badge>
        ) : (
          <Badge tone="neutral">Imekatika</Badge>
        ),
    },
    {
      key: 'ping',
      header: 'Ping ya mwisho',
      hideOnMobile: true,
      align: 'right',
      cell: (a) => <span className="text-slate-400">{a.lastPing ? timeAgo(a.lastPing) : 'Kamwe'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" /> Tengeneza agent
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna agent"
        emptyDescription="Tengeneza agent ili kuunganisha router zako."
        actions={
          canManage
            ? (a) => (
                <Button variant="ghost" size="sm" onClick={() => setRevoking(a)} aria-label="Ondoa">
                  <TrashIcon className="h-4 w-4 text-danger-600" />
                </Button>
              )
            : undefined
        }
      />

      <AgentCreateDialog open={creating} onClose={() => setCreating(false)} />
      <DeleteConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        isLoading={revoke.isPending}
        title="Ondoa agent"
        message={`Ukiondoa "${revoking?.name}", token yake haitafanya kazi tena.`}
        onConfirm={() => revoking && revoke.mutate(revoking.id, { onSuccess: () => setRevoking(null) })}
      />
    </div>
  );
}
