import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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

/** Agent health from last ping: connected (<60s), stale (<10min), or offline. */
function agentHealth(lastPing: string | null): { label: string; tone: 'success' | 'warning' | 'neutral'; dot: string } {
  if (!lastPing) return { label: 'Haijawahi kuonekana', tone: 'neutral', dot: 'bg-slate-400' };
  const age = Date.now() - new Date(lastPing).getTime();
  if (age < 60_000) return { label: 'Hai (online)', tone: 'success', dot: 'bg-emerald-500' };
  if (age < 600_000) return { label: 'Inakaribia kukatika', tone: 'warning', dot: 'bg-amber-500' };
  return { label: 'Imekatika (offline)', tone: 'neutral', dot: 'bg-slate-400' };
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
      cell: (a) => {
        const h = agentHealth(a.lastPing);
        return (
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${h.dot}`} aria-hidden />
            <span className="font-medium">{a.name}</span>
          </div>
        );
      },
    },
    {
      key: 'conn',
      header: 'Hali',
      cell: (a) => {
        const h = agentHealth(a.lastPing);
        return <Badge tone={h.tone}>{h.label}</Badge>;
      },
    },
    {
      key: 'router',
      header: 'Router',
      hideOnMobile: true,
      cell: (a) => <span className="text-slate-400">{a.routerId ? 'Imeunganishwa' : 'Kampuni nzima'}</span>,
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
        emptyTitle="Hakuna agent bado"
        emptyDescription="Bonyeza 'Tengeneza agent' kuunda agent, kisha nakili token yake kwenda kwenye computer inayoendesha agent karibu na MikroTik."
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
