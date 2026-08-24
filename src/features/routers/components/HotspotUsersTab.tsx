import { useState } from 'react';
import { PlusIcon, TrashIcon, PowerIcon } from '@heroicons/react/24/outline';
import { RouterSyncView } from './RouterSyncView';
import { HotspotUserDialog } from './HotspotUserDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { useRouterCommand } from '../hooks/useRouterCommand';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { HotspotUser } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const columns: Column<HotspotUser>[] = [
  { key: 'name', header: 'Jina', cell: (r) => r.name ?? '—' },
  { key: 'profile', header: 'Profile', hideOnMobile: true, cell: (r) => r.profile ?? '—' },
  { key: 'limit', header: 'Kikomo cha muda', hideOnMobile: true, cell: (r) => r['limit-uptime'] ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (r) => <Badge tone={r.disabled === 'true' ? 'neutral' : 'success'}>{r.disabled === 'true' ? 'Imezimwa' : 'Hai'}</Badge>,
  },
];

export function HotspotUsersTab({ routerId }: { routerId: string }) {
  const { send } = useRouterCommand();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<HotspotUser | null>(null);

  const toggle = (u: HotspotUser) =>
    send(routerId, u.disabled === 'true' ? 'hotspot.enable_user' : 'hotspot.disable_user', { id: u['.id'] });

  const actions = canManage
    ? (u: HotspotUser) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => toggle(u)} aria-label="Wezesha/Zima">
            <PowerIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleting(u)} aria-label="Futa">
            <TrashIcon className="h-4 w-4 text-danger-600" />
          </Button>
        </div>
      )
    : undefined;

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Ongeza mtumiaji
          </Button>
        </div>
      )}

      <RouterSyncView<HotspotUser>
        routerId={routerId}
        kind="hotspot.users"
        columns={columns}
        rowKey={(r) => r['.id']}
        emptyTitle="Hakuna watumiaji wa hotspot"
        actions={actions}
      />

      <HotspotUserDialog routerId={routerId} open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Futa mtumiaji"
        message={`Futa "${deleting?.name}"? Hii itaondoa mtumiaji kwenye MikroTik.`}
        confirmLabel="Futa"
        onConfirm={async () => {
          if (deleting) await send(routerId, 'hotspot.delete_user', { id: deleting['.id'] });
          setDeleting(null);
        }}
      />
    </div>
  );
}
