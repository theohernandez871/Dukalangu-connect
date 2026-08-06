import { RouterSyncView } from './RouterSyncView';
import { Badge } from '@/components/ui/Badge';
import type { HotspotServer } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const columns: Column<HotspotServer>[] = [
  { key: 'name', header: 'Jina', cell: (r) => r.name ?? '—' },
  { key: 'interface', header: 'Interface', cell: (r) => r.interface ?? '—' },
  { key: 'profile', header: 'Profile', hideOnMobile: true, cell: (r) => r.profile ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (r) => <Badge tone={r.disabled === 'true' ? 'neutral' : 'success'}>{r.disabled === 'true' ? 'Imezimwa' : 'Hai'}</Badge>,
  },
];

export function HotspotServersTab({ routerId }: { routerId: string }) {
  return (
    <RouterSyncView<HotspotServer>
      routerId={routerId}
      kind="hotspot.servers"
      columns={columns}
      rowKey={(r) => r['.id']}
      emptyTitle="Hakuna hotspot servers"
    />
  );
}
