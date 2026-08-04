import { Badge } from '@/components/ui/Badge';
import type { OmadaStatus } from '../types/omada';

const CONFIG: Record<OmadaStatus, { tone: 'success' | 'danger' | 'neutral' | 'warning'; label: string }> = {
  online: { tone: 'success', label: 'Online' },
  offline: { tone: 'danger', label: 'Offline' },
  error: { tone: 'warning', label: 'Hitilafu' },
  unknown: { tone: 'neutral', label: 'Haijulikani' },
};

export function OmadaStatusBadge({ status }: { status: OmadaStatus }) {
  const { tone, label } = CONFIG[status];
  return (
    <Badge tone={tone}>
      <span
        className={
          'h-1.5 w-1.5 rounded-full ' +
          (status === 'online'
            ? 'bg-success-500'
            : status === 'offline'
              ? 'bg-danger-500'
              : status === 'error'
                ? 'bg-warning-500'
                : 'bg-slate-400')
        }
      />
      {label}
    </Badge>
  );
}
