import { useState } from 'react';
import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { RouterDataView } from './RouterDataView';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { useRouterAction } from '../hooks/useRouterAction';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { HotspotActive } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

export function HotspotActiveTab({ routerId }: { routerId: string }) {
  const { run, isRunning } = useRouterAction();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');
  const [kicking, setKicking] = useState<HotspotActive | null>(null);

  const columns: Column<HotspotActive>[] = [
    { key: 'user', header: 'Mtumiaji', cell: (r) => r.user ?? '—' },
    { key: 'address', header: 'IP', hideOnMobile: true, cell: (r) => r.address ?? '—' },
    { key: 'mac', header: 'MAC', hideOnMobile: true, cell: (r) => r['mac-address'] ?? '—' },
    { key: 'uptime', header: 'Muda', cell: (r) => r.uptime ?? '—' },
  ];

  return (
    <>
      <RouterDataView<HotspotActive>
        routerId={routerId}
        command="hotspot.active"
        columns={columns}
        rowKey={(r) => r['.id']}
        emptyTitle="Hakuna watumiaji hai"
        actions={
          canManage
            ? (r) => (
                <Button variant="ghost" size="sm" onClick={() => setKicking(r)} aria-label="Ondoa">
                  <NoSymbolIcon className="h-4 w-4 text-danger-600" />
                </Button>
              )
            : undefined
        }
      />
      <DeleteConfirmDialog
        open={!!kicking}
        onClose={() => setKicking(null)}
        isLoading={isRunning}
        title="Ondoa mtumiaji"
        message={`Ondoa "${kicking?.user}" kwenye hotspot?`}
        onConfirm={async () => {
          if (kicking) {
            await run(routerId, 'hotspot.kick', kicking['.id']);
            setKicking(null);
          }
        }}
      />
    </>
  );
}
