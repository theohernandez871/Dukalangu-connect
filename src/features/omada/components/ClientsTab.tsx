import { OmadaDataView } from './OmadaDataView';
import { Badge } from '@/components/ui/Badge';
import type { OmadaClient } from '../types/omada';
import type { Column } from '@/components/data/dataTable.types';

function toClients(raw: unknown): OmadaClient[] {
  const arr = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
  return (arr as Record<string, unknown>[]).map((c) => ({
    mac: String(c.mac ?? ''),
    name: (c.name as string) ?? (c.hostName as string),
    ip: c.ip as string,
    signalLevel: c.signalLevel as number,
    ssid: c.ssid as string,
  }));
}

// Signal quality tone from Omada signalLevel (0-100).
function signalTone(level?: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (level == null) return 'neutral';
  if (level >= 70) return 'success';
  if (level >= 40) return 'warning';
  return 'danger';
}

const columns: Column<OmadaClient>[] = [
  { key: 'name', header: 'Mteja', cell: (c) => c.name ?? c.mac },
  { key: 'ip', header: 'IP', hideOnMobile: true, cell: (c) => c.ip ?? '—' },
  { key: 'ssid', header: 'SSID', hideOnMobile: true, cell: (c) => c.ssid ?? '—' },
  {
    key: 'signal',
    header: 'Signal',
    cell: (c) => (c.signalLevel != null ? <Badge tone={signalTone(c.signalLevel)}>{c.signalLevel}%</Badge> : '—'),
  },
];

export function ClientsTab({ controllerId }: { controllerId: string }) {
  return (
    <OmadaDataView<OmadaClient>
      controllerId={controllerId}
      command="omada.clients"
      columns={columns}
      rowKey={(c) => c.mac}
      emptyTitle="Hakuna wateja walioungana"
      select={toClients}
    />
  );
}
