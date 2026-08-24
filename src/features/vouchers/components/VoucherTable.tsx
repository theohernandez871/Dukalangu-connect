import { useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { VoucherStatusBadge } from './VoucherStatusBadge';
import { VoucherPreviewDialog } from './VoucherPreviewDialog';
import { useVouchers } from '../hooks/useVouchers';
import { formatCode } from '../utils/codes';
import type { Voucher } from '../types/voucher';
import type { Column } from '@/components/data/dataTable.types';

const STATUS_OPTIONS = [
  { value: '', label: 'Hali zote' },
  { value: 'unused', label: 'Haijatumika' },
  { value: 'used', label: 'Imetumika' },
  { value: 'expired', label: 'Imeisha muda' },
  { value: 'disabled', label: 'Imezimwa' },
];

export function VoucherTable({ batchId }: { batchId?: string }) {
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState<Voucher | null>(null);
  const { data, isLoading, isError, refetch } = useVouchers(batchId, status || undefined);

  const columns: Column<Voucher>[] = [
    { key: 'code', header: 'Namba', cell: (v) => <span className="font-mono font-medium">{formatCode(v.code)}</span> },
    { key: 'package', header: 'Kifurushi', hideOnMobile: true, cell: (v) => v.packageName ?? '—' },
    { key: 'status', header: 'Hali', cell: (v) => <VoucherStatusBadge status={v.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna vocha"
        actions={(v) => (
          <Button variant="ghost" size="sm" onClick={() => setPreview(v)} aria-label="Ona">
            <EyeIcon className="h-4 w-4" />
          </Button>
        )}
      />

      <VoucherPreviewDialog voucher={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
