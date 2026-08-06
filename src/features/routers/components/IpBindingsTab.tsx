import { RouterSyncView } from './RouterSyncView';
import { Badge } from '@/components/ui/Badge';
import type { IpBinding } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const columns: Column<IpBinding>[] = [
  { key: 'mac', header: 'MAC', cell: (r) => r['mac-address'] ?? '—' },
  { key: 'address', header: 'Anwani', cell: (r) => r.address ?? '—' },
  { key: 'type', header: 'Aina', hideOnMobile: true, cell: (r) => r.type ?? '—' },
  { key: 'comment', header: 'Maelezo', hideOnMobile: true, cell: (r) => r.comment ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (r) => <Badge tone={r.disabled === 'true' ? 'neutral' : 'success'}>{r.disabled === 'true' ? 'Imezimwa' : 'Hai'}</Badge>,
  },
];

export function IpBindingsTab({ routerId }: { routerId: string }) {
  return (
    <RouterSyncView<IpBinding>
      routerId={routerId}
      kind="hotspot.bindings"
      columns={columns}
      rowKey={(r) => r['.id']}
      emptyTitle="Hakuna IP bindings"
    />
  );
}
