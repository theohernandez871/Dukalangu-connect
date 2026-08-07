import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/feedback/Alert';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { QuickSellCard } from '../components/QuickSellCard';
import { VoucherPreviewDialog } from '../components/VoucherPreviewDialog';
import { useVoucherMutations } from '../hooks/useVouchers';
import { usePackages } from '@/features/packages/hooks/usePackages';
import { useRouters } from '@/features/routers/hooks/useRouters';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Package } from '@/features/packages/types/package';
import type { Voucher } from '../types/voucher';

/** Quick Sell: tap a package to instantly mint ONE voucher + hotspot user and
 *  show it ready to print — for over-the-counter single sales. */
export function QuickSellPage() {
  const { data: packages, isLoading } = usePackages();
  const { data: routers } = useRouters();
  const { quickSell } = useVoucherMutations();
  const { hasPermission } = useAuth();
  const canSell = hasPermission('voucher:manage');

  const [routerId, setRouterId] = useState('');
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = (packages ?? []).filter((p) => p.isActive);
  const routerOptions = (routers ?? []).map((r) => ({ value: r.id, label: r.name }));

  const sell = (pkg: Package) => {
    setError(null);
    setSellingId(pkg.id);
    quickSell.mutate(
      {
        packageId: pkg.id,
        count: 1,
        length: 8,
        branchId: pkg.branchId,
        validDays: pkg.validityDays,
        routerId: routerId || null,
        routerProfile: pkg.routerProfile,
      },
      {
        onSuccess: (v) => setVoucher(v),
        onError: (e) => setError(e instanceof Error ? e.message : 'Imeshindikana kuuza voucher.'),
        onSettled: () => setSellingId(null),
      },
    );
  };

  if (!canSell) return <Alert tone="warning">Huna ruhusa ya kuuza vocha.</Alert>;

  return (
    <div>
      <PageHeader title="Uza Haraka" subtitle="Chagua kifurushi kuuza voucher moja papo hapo" />

      <div className="mb-4 max-w-sm">
        <Select
          label="Router (hiari — kupeleka MikroTik)"
          placeholder="Usipeleke MikroTik"
          value={routerId}
          onChange={(e) => setRouterId(e.target.value)}
          options={routerOptions}
        />
      </div>

      {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : active.length === 0 ? (
        <Alert tone="info">Hakuna vifurushi vinavyotumika. Ongeza kifurushi kwanza.</Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((p) => (
            <QuickSellCard
              key={p.id}
              pkg={p}
              selling={sellingId === p.id}
              disabled={quickSell.isPending}
              onSell={sell}
            />
          ))}
        </div>
      )}

      <VoucherPreviewDialog voucher={voucher} onClose={() => setVoucher(null)} />
    </div>
  );
}
