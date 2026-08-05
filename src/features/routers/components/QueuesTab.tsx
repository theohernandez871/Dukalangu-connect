import { RouterSyncView } from './RouterSyncView';
import { Badge } from '@/components/ui/Badge';
import type { SimpleQueue } from '../types/routeros';
import type { Column } from '@/components/data/dataTable.types';

const columns: Column<SimpleQueue>[] = [
  { key: 'name', header: 'Jina', cell: (r) => r.name ?? '—' },
  { key: 'target', header: 'Lengo', hideOnMobile: true, cell: (r) => r.target ?? '—' },
  { key: 'limit', header: 'Kikomo', cell: (r) => r['max-limit'] ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (r) => <Badge tone={r.disabled === 'true' ? 'neutral' : 'success'}>{r.disabled === 'true' ? 'Imezimwa' : 'Hai'}</Badge>,
  },
];

export function QueuesTab({ routerId }: { routerId: string }) {
  return (
    <RouterSyncView<SimpleQueue>
      routerId={routerId}
      kind="queue.simple"
      columns={columns}
      rowKey={(r) => r['.id']}
      emptyTitle="Hakuna queues"
    />
  );
}
