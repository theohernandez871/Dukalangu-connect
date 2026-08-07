import { useState } from 'react';
import {
  CurrencyDollarIcon,
  TicketIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/data/DataTable';
import { useVoucherReport, useBranchReports } from '../hooks/useReports';
import { useBranches } from '@/features/companies/hooks/useCompany';
import { formatTsh } from '@/utils/currency';
import type { BranchReport } from '../types/report';
import type { Column } from '@/components/data/dataTable.types';

export function ReportsPage() {
  const [branchId, setBranchId] = useState('');
  const { data: report, isLoading } = useVoucherReport(branchId || null);
  const { data: branchReports, isLoading: loadingBranches } = useBranchReports();
  const { data: branches } = useBranches();

  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));

  const branchColumns: Column<BranchReport>[] = [
    { key: 'name', header: 'Tawi', cell: (r) => r.branchName },
    { key: 'count', header: 'Vocha', cell: (r) => String(r.voucherCount) },
    { key: 'used', header: 'Zilizotumika', hideOnMobile: true, cell: (r) => String(r.usedCount) },
    { key: 'revenue', header: 'Mapato', cell: (r) => formatTsh(r.revenue) },
  ];

  return (
    <div>
      <PageHeader title="Ripoti" subtitle="Mauzo, mapato, na matumizi ya vocha" />

      <div className="mb-4 max-w-xs">
        <Select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          options={[{ value: '', label: 'Matawi yote' }, ...branchOptions]}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Mauzo Leo" value={formatTsh(report?.salesTodayRevenue ?? 0)} icon={CalendarDaysIcon} accent="primary" index={0} />
          <StatCard label="Mauzo Wiki" value={formatTsh(report?.salesWeekRevenue ?? 0)} icon={CalendarIcon} accent="accent" index={1} />
          <StatCard label="Mauzo Mwezi" value={formatTsh(report?.salesMonthRevenue ?? 0)} icon={ClockIcon} accent="info" index={2} />
          <StatCard label="Mapato Jumla" value={formatTsh(report?.totalRevenue ?? 0)} icon={CurrencyDollarIcon} accent="success" index={3} />
          <StatCard label="Vocha Zilizotumika" value={String(report?.usedVouchers ?? 0)} icon={CheckCircleIcon} accent="warning" index={4} />
          <StatCard label="Vocha Jumla" value={String(report?.totalVouchers ?? 0)} icon={TicketIcon} accent="primary" index={5} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Ripoti kwa Tawi</h2>
        <DataTable
          columns={branchColumns}
          data={branchReports ?? []}
          rowKey={(r) => r.branchId}
          isLoading={loadingBranches}
          isError={false}
          emptyTitle="Hakuna data ya matawi"
        />
      </div>
    </div>
  );
}
