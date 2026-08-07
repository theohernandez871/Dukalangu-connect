import { useState } from 'react';
import { NoSymbolIcon, ClockIcon } from '@heroicons/react/24/outline';
import { RouterSyncView } from './RouterSyncView';
import { ExtendTimeDialog } from './ExtendTimeDialog';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { useRouterAction } from '../hooks/useRouterAction';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatBytes, formatRemainingData, formatTimeLeft } from '../utils/sessionFormat';
import type { HotspotActive } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

export function HotspotActiveTab({ routerId }: { routerId: string }) {
  const { run, isRunning } = useRouterAction();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');
  const [kicking, setKicking] = useState<HotspotActive | null>(null);
  const [extending, setExtending] = useState<HotspotActive | null>(null);

  const columns: Column<HotspotActive>[] = [
    { key: 'user', header: 'Mtumiaji', cell: (r) => r.user ?? '—' },
    { key: 'address', header: 'IP', hideOnMobile: true, cell: (r) => r.address ?? '—' },
    { key: 'uptime', header: 'Muda', cell: (r) => r.uptime ?? '—' },
    { key: 'timeleft', header: 'Muda uliobaki', hideOnMobile: true, cell: (r) => formatTimeLeft(r['session-time-left']) },
    { key: 'down', header: 'Download', hideOnMobile: true, cell: (r) => formatBytes(r['bytes-in']) },
    { key: 'up', header: 'Upload', hideOnMobile: true, cell: (r) => formatBytes(r['bytes-out']) },
    { key: 'dataleft', header: 'Data iliyobaki', hideOnMobile: true, cell: (r) => formatRemainingData(r) },
  ];

  return (
    <>
      <RouterSyncView<HotspotActive>
        routerId={routerId}
        kind="hotspot.active"
        columns={columns}
        rowKey={(r) => r['.id']}
        emptyTitle="Hakuna watumiaji hai"
        actions={
          canManage
            ? (r) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setExtending(r)} aria-label="Ongeza muda">
                    <ClockIcon className="h-4 w-4 text-primary-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setKicking(r)} aria-label="Ondoa">
                    <NoSymbolIcon className="h-4 w-4 text-danger-600" />
                  </Button>
                </div>
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
        confirmLabel="Ondoa"
        onConfirm={async () => {
          if (kicking) {
            await run(routerId, 'hotspot.kick', kicking['.id']);
            setKicking(null);
          }
        }}
      />

      <ExtendTimeDialog
        routerId={routerId}
        active={extending}
        onClose={() => setExtending(null)}
      />
    </>
  );
}
