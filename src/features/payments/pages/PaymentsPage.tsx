import { useState } from 'react';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/data/DataTable';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { usePayments, usePaymentSummary } from '../hooks/usePayments';
import { formatTsh } from '@/utils/currency';
import type { PaymentTransaction, PaymentStatus } from '../types/payment';
import type { Column } from '@/components/data/dataTable.types';

const STATUS_OPTIONS = [
  { value: '', label: 'Hali zote' },
  { value: 'completed', label: 'Imekamilika' },
  { value: 'pending', label: 'Inasubiri' },
  { value: 'failed', label: 'Imeshindwa' },
  { value: 'voided', label: 'Imefutwa' },
  { value: 'expired', label: 'Imeisha' },
];

export function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data: summary, isLoading: loadingSummary } = usePaymentSummary();
  const { data: payments, isLoading, isError, refetch } = usePayments(
    (status || undefined) as PaymentStatus | undefined,
    search,
  );

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('sw-TZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const columns: Column<PaymentTransaction>[] = [
    { key: 'date', header: 'Tarehe', cell: (p) => <span className="text-slate-500">{fmtDate(p.createdAt)}</span> },
    { key: 'phone', header: 'Simu', cell: (p) => <span className="font-mono">{p.phoneNumber}</span> },
    { key: 'package', header: 'Kifurushi', hideOnMobile: true, cell: (p) => p.packageName ?? '—' },
    { key: 'amount', header: 'Kiasi', cell: (p) => formatTsh(p.amount) },
    { key: 'status', header: 'Hali', cell: (p) => <PaymentStatusBadge status={p.status} /> },
    { key: 'voucher', header: 'Vocha', hideOnMobile: true, cell: (p) => (p.voucherCode ? <span className="font-mono">{p.voucherCode}</span> : '—') },
  ];

  return (
    <div>
      <PageHeader title="Malipo" subtitle="Muamala wa malipo ya mtandaoni (Snippe)" />

      {loadingSummary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Mapato (yaliyokamilika)" value={formatTsh(summary?.revenue ?? 0)} icon={CurrencyDollarIcon} accent="success" index={0} />
          <StatCard label="Yaliyokamilika" value={String(summary?.completed ?? 0)} icon={CheckCircleIcon} accent="primary" index={1} />
          <StatCard label="Yanasubiri" value={String(summary?.pending ?? 0)} icon={ClockIcon} accent="warning" index={2} />
          <StatCard label="Yaliyoshindwa" value={String(summary?.failed ?? 0)} icon={XCircleIcon} accent="danger" index={3} />
        </div>
      )}

      <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="sm:max-w-xs sm:flex-1">
          <Input placeholder="Tafuta kwa simu, vocha, au reference" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="sm:w-48">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments ?? []}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="Hakuna malipo bado"
        emptyDescription="Malipo ya wateja kupitia portal yataonekana hapa."
      />
    </div>
  );
}
