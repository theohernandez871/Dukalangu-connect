import { RouterSyncView } from './RouterSyncView';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/feedback/Alert';
import type { FirewallRule } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const columns: Column<FirewallRule>[] = [
  { key: 'chain', header: 'Chain', cell: (r) => r.chain ?? '—' },
  {
    key: 'action',
    header: 'Kitendo',
    cell: (r) => <Badge tone={r.action === 'drop' || r.action === 'reject' ? 'danger' : 'neutral'}>{r.action ?? '—'}</Badge>,
  },
  { key: 'protocol', header: 'Protocol', hideOnMobile: true, cell: (r) => r.protocol ?? '—' },
  { key: 'comment', header: 'Maelezo', hideOnMobile: true, cell: (r) => r.comment ?? '—' },
];

export function FirewallTab({ routerId }: { routerId: string }) {
  return (
    <div className="space-y-3">
      <Alert tone="info">Firewall inaonyeshwa kwa kusoma tu (view-only) kwa usalama.</Alert>
      <RouterSyncView<FirewallRule>
        routerId={routerId}
        kind="firewall.filter"
        columns={columns}
        rowKey={(r) => r['.id']}
        emptyTitle="Hakuna firewall rules"
      />
    </div>
  );
}
