import { OmadaDataView } from './OmadaDataView';
import { Badge } from '@/components/ui/Badge';
import type { OmadaDevice } from '../types/omada';
import type { Column } from '@/components/data/dataTable.types';

// Omada returns device.status: 1 = connected/online.
function toDevices(raw: unknown): OmadaDevice[] {
  const arr = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
  return (arr as Record<string, unknown>[]).map((d) => ({
    mac: String(d.mac ?? ''),
    name: d.name as string,
    type: d.type as string,
    status: d.status as number,
    model: d.model as string,
    ip: d.ip as string,
  }));
}

const columns: Column<OmadaDevice>[] = [
  { key: 'name', header: 'Kifaa', cell: (d) => d.name ?? d.mac },
  { key: 'type', header: 'Aina', hideOnMobile: true, cell: (d) => d.type ?? '—' },
  { key: 'model', header: 'Model', hideOnMobile: true, cell: (d) => d.model ?? '—' },
  { key: 'ip', header: 'IP', hideOnMobile: true, cell: (d) => d.ip ?? '—' },
  {
    key: 'status',
    header: 'Hali',
    cell: (d) => <Badge tone={d.status === 1 ? 'success' : 'neutral'}>{d.status === 1 ? 'Online' : 'Offline'}</Badge>,
  },
];

export function DevicesTab({ controllerId, apOnly = false }: { controllerId: string; apOnly?: boolean }) {
  return (
    <OmadaDataView<OmadaDevice>
      controllerId={controllerId}
      command={apOnly ? 'omada.aps' : 'omada.devices'}
      columns={columns}
      rowKey={(d) => d.mac}
      emptyTitle={apOnly ? 'Hakuna Access Points' : 'Hakuna vifaa'}
      select={(raw) => {
        const all = toDevices(raw);
        return apOnly ? all.filter((d) => (d.type ?? '').toLowerCase() === 'ap') : all;
      }}
    />
  );
}
