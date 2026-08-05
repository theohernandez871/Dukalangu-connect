import { useState } from 'react';
import { buildVoucherPdf } from '../utils/pdf';
import { voucherService } from '../services/voucher.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCompany } from '@/features/companies/hooks/useCompany';
import { usePackages } from '@/features/packages/hooks/usePackages';

/** Fetch a batch's vouchers, build a PDF, and open it in a new tab. */
export function useBatchPdf() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const { data: company } = useCompany();
  const { data: packages } = usePackages();
  const [building, setBuilding] = useState<string | null>(null);

  const print = async (batchId: string, packageId: string | null) => {
    setBuilding(batchId);
    try {
      const vouchers = await voucherService.listVouchers(companyId, batchId);
      const pkg = packages?.find((p) => p.id === packageId);
      const url = await buildVoucherPdf(vouchers, {
        companyName: company?.name ?? 'Hotspot',
        packageName: pkg?.name ?? null,
        price: pkg?.price ?? null,
      });
      window.open(url, '_blank');
    } finally {
      setBuilding(null);
    }
  };

  return { print, building };
}
