import { RouterDataView } from './RouterDataView';
import type { Column } from '@/components/data/dataTable.types';

// Hotspot + PPP profiles share a simple {name} shape for display.
interface ProfileRow { '.id': string; name?: string; }

const columns: Column<ProfileRow>[] = [
  { key: 'name', header: 'Jina la profile', cell: (r) => r.name ?? '—' },
];

export function ProfilesTab({ routerId }: { routerId: string }) {
  return (
    <RouterDataView<ProfileRow>
      routerId={routerId}
      command="hotspot.profiles"
      columns={columns}
      rowKey={(r) => r['.id']}
      emptyTitle="Hakuna profiles"
    />
  );
}
