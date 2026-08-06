import { useState } from 'react';
import { PrinterIcon, TrashIcon, EyeIcon, SignalIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { PushBatchDialog } from './PushBatchDialog';
import { useBatches, useVoucherMutations } from '../hooks/useVouchers';
import { useBatchPdf } from '../hooks/useBatchPdf';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { timeAgo } from '@/utils/currency';
import type { VoucherBatch } from '../types/voucher';
import type { Column } from '@/components/data/dataTable.types';

export function VoucherBatchList({ onView }: { onView: (batchId: string) => void }) {
  const { data, isLoading, isError, refetch } = useBatches();
  const { removeBatch } = useVoucherMutations();
  const { print, building } = useBatchPdf();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('voucher:manage');
  const [deleting, setDeleting] = useState<VoucherBatch | null>(null);
  const [pushing, setPushing] = useState<string | null>(null);

  const columns: Column<VoucherBatch>[] = [
    { key: 'package', header: 'Kifurushi', cell: (b) => b.packageName ?? '—' },
    { key: 'count', header: 'Idadi', cell: (b) => <Badge tone="primary">{b.count}</Badge> },
    { key: 'notes', header: 'Maelezo', hideOnMobile: true, cell: (b) => b.notes ?? '—' },
    { key: 'created', header: 'Imetengenezwa', hideOnMobile: true, align: 'right', cell: (b) => <span className="text-slate-400">{timeAgo(b.createdAt)}</span> },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data ?? []}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="Hakuna batches"
        emptyDescription="Tengeneza kundi lako la kwanza la vocha."
        actions={(b) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => onView(b.id)} aria-label="Ona">
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" isLoading={building === b.id} onClick={() => print(b.id, b.packageId)} aria-label="Chapisha">
              <PrinterIcon className="h-4 w-4" />
            </Button>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => setPushing(b.id)} aria-label="Peleka MikroTik">
                <SignalIcon className="h-4 w-4 text-primary-600" />
              </Button>
            )}
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => setDeleting(b)} aria-label="Futa">
                <TrashIcon className="h-4 w-4 text-danger-600" />
              </Button>
            )}
          </div>
        )}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={removeBatch.isPending}
        title="Futa batch"
        message={`Kufuta batch hii kutafuta vocha zake ${deleting?.count} zote. Endelea?`}
        onConfirm={() => deleting && removeBatch.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
      <PushBatchDialog batchId={pushing} onClose={() => setPushing(null)} />
    </>
  );
}
