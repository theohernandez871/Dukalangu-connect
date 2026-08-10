import { Badge } from '@/components/ui/Badge';
import type { PaymentStatus } from '../types/payment';

const MAP: Record<PaymentStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  completed: { label: 'Imekamilika', tone: 'success' },
  pending: { label: 'Inasubiri', tone: 'warning' },
  failed: { label: 'Imeshindwa', tone: 'danger' },
  voided: { label: 'Imefutwa', tone: 'neutral' },
  expired: { label: 'Imeisha', tone: 'neutral' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = MAP[status] ?? MAP.pending;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
