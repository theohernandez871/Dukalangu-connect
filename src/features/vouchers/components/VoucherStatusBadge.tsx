import { Badge } from '@/components/ui/Badge';
import type { VoucherStatus } from '../types/voucher';

const CONFIG: Record<VoucherStatus, { tone: 'success' | 'neutral' | 'warning' | 'danger'; label: string }> = {
  unused: { tone: 'success', label: 'Haijatumika' },
  used: { tone: 'neutral', label: 'Imetumika' },
  expired: { tone: 'warning', label: 'Imeisha muda' },
  disabled: { tone: 'danger', label: 'Imezimwa' },
};

export function VoucherStatusBadge({ status }: { status: VoucherStatus }) {
  const { tone, label } = CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
