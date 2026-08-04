import { RouterDataView } from './RouterDataView';
import { Badge } from '@/components/ui/Badge';
import type { DhcpLease } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const columns: Column<DhcpLease>[] = [
  { key: 'address', header: 'IP', cell: (r) => r.address ?? '—' },
  { key: 'mac', header: 'MAC', hideOnMobile: true, cell: (r) => r['mac-address'] ?? '—' },
  { key: 'host', header: 'Kifaa', hideOnMobile: true, cell: (r) => r.host ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (r) => <Badge tone={r.status === 'bound' ? 'success' : 'neutral'}>{r.status ?? '—'}</Badge>,
  },
];

export function DhcpTab({ routerId }: { routerId: string }) {
  return (
    <RouterDataView<DhcpLease>
      routerId={routerId}
      command="dhcp.leases"
      columns={columns}
      rowKey={(r) => r['.id']}
      emptyTitle="Hakuna DHCP leases"
    />
  );
}
