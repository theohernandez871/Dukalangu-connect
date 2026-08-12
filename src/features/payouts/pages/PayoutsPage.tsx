import { useState } from 'react';
import { BanknotesIcon, ArrowUpTrayIcon, WalletIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/data/DataTable';
import { Alert } from '@/components/feedback/Alert';
import { AddPayoutDialog } from '../components/AddPayoutDialog';
import { usePayouts, usePayoutBalance, usePayoutActions } from '../hooks/usePayouts';
import { formatTsh } from '@/utils/currency';
import type { Payout } from '../types/payout';
import type { Column } from '@/components/data/dataTable.types';

export function PayoutsPage() {
  const [adding, setAdding] = useState(false);
  const { data: balance, isLoading: loadingBalance } = usePayoutBalance();
  const { data: payouts, isLoading, isError, refetch } = usePayouts();
  const { remove } = usePayoutActions();

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });

  const columns: Column<Payout>[] = [
    { key: 'date', header: 'Tarehe', cell: (p) => fmtDate(p.paidAt) },
    { key: 'amount', header: 'Kiasi', cell: (p) => <span className="font-semibold">{formatTsh(p.amount)}</span> },
    { key: 'dest', header: 'Kwenda', hideOnMobile: true, cell: (p) => p.destination ?? '—' },
    { key: 'note', header: 'Maelezo', hideOnMobile: true, cell: (p) => p.note ?? '—' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <button
          type="button"
          onClick={() => remove.mutate(p.id)}
          className="text-slate-400 hover:text-red-500"
          aria-label="Futa"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fedha"
        subtitle="Fuatilia mauzo, zilizotolewa, na zilizobaki"
        actions={
          <Button onClick={() => setAdding(true)}>
            <PlusIcon className="h-4 w-4" /> Rekodi utoaji
          </Button>
        }
      />

      <Alert tone="info">
        Pesa halisi ziko kwenye akaunti yako ya Snippe. Hapa unarekodi tu ulizotoa,
        ili ujue mauzo yako yamefikia wapi. Kutoa pesa halisi hufanyika Snippe.
      </Alert>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loadingBalance ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Mauzo jumla" value={formatTsh(balance?.totalRevenue ?? 0)} icon={BanknotesIcon} accent="success" index={0} />
            <StatCard label="Ulizotoa" value={formatTsh(balance?.totalWithdrawn ?? 0)} icon={ArrowUpTrayIcon} accent="info" index={1} />
            <StatCard label="Zilizobaki (kadirio)" value={formatTsh(balance?.remaining ?? 0)} icon={WalletIcon} accent="primary" index={2} />
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Historia ya utoaji</h2>
        <DataTable
          columns={columns}
          data={payouts ?? []}
          rowKey={(p) => p.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyTitle="Hakuna utoaji bado"
          emptyDescription="Bonyeza 'Rekodi utoaji' kurekodi pesa ulizotoa Snippe."
        />
      </div>

      <AddPayoutDialog open={adding} onClose={() => setAdding(false)} remaining={balance?.remaining ?? 0} />
    </div>
  );
}
