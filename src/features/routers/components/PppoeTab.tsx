import { useState } from 'react';
import { PowerIcon } from '@heroicons/react/24/outline';
import { RouterSyncView } from './RouterSyncView';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { useRouterAction } from '../hooks/useRouterAction';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PppSecret, PppActive } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const TABS: TabItem[] = [
  { id: 'active', label: 'Hai' },
  { id: 'secrets', label: 'Akaunti' },
];

const secretCols: Column<PppSecret>[] = [
  { key: 'name', header: 'Jina', cell: (r) => r.name ?? '—' },
  { key: 'service', header: 'Huduma', hideOnMobile: true, cell: (r) => r.service ?? '—' },
  { key: 'profile', header: 'Profile', hideOnMobile: true, cell: (r) => r.profile ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (r) => <Badge tone={r.disabled === 'true' ? 'neutral' : 'success'}>{r.disabled === 'true' ? 'Imezimwa' : 'Hai'}</Badge>,
  },
];

export function PppoeTab({ routerId }: { routerId: string }) {
  const [tab, setTab] = useState('active');
  const { run, isRunning } = useRouterAction();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');
  const [cutting, setCutting] = useState<PppActive | null>(null);

  const activeCols: Column<PppActive>[] = [
    { key: 'name', header: 'Jina', cell: (r) => r.name ?? '—' },
    { key: 'address', header: 'IP', hideOnMobile: true, cell: (r) => r.address ?? '—' },
    { key: 'uptime', header: 'Muda', cell: (r) => r.uptime ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'active' ? (
        <>
          <RouterSyncView<PppActive>
            routerId={routerId}
            kind="pppoe.active"
            columns={activeCols}
            rowKey={(r) => r['.id']}
            emptyTitle="Hakuna muunganisho hai"
            actions={
              canManage
                ? (r) => (
                    <Button variant="ghost" size="sm" onClick={() => setCutting(r)} aria-label="Kata">
                      <PowerIcon className="h-4 w-4 text-danger-600" />
                    </Button>
                  )
                : undefined
            }
          />
          <DeleteConfirmDialog
            open={!!cutting}
            onClose={() => setCutting(null)}
            isLoading={isRunning}
            title="Kata muunganisho"
            message={`Kata muunganisho wa "${cutting?.name}"?`}
            onConfirm={async () => {
              if (cutting) {
                await run(routerId, 'pppoe.disconnect', cutting['.id']);
                setCutting(null);
              }
            }}
          />
        </>
      ) : (
        <RouterSyncView<PppSecret>
          routerId={routerId}
          kind="pppoe.secrets"
          columns={secretCols}
          rowKey={(r) => r['.id']}
          emptyTitle="Hakuna akaunti za PPPoE"
        />
      )}
    </div>
  );
}
