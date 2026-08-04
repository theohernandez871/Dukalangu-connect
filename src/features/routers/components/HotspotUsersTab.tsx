import { RouterDataView } from './RouterDataView';
import { Badge } from '@/components/ui/Badge';
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
  return (
    <RouterDataView<HotspotUser>
      routerId={routerId}
      command="hotspot.users"
      columns={columns}
      rowKey={(r) => r['.id']}
      emptyTitle="Hakuna watumiaji wa hotspot"
    />
  );
}
