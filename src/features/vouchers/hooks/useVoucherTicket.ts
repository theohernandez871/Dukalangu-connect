import { useState } from 'react';
import { buildThermalTicket, type TicketSize } from '../utils/voucherTicket';
import { buildVoucherPdf } from '../utils/pdf';
import { useCompany, useBranches } from '@/features/companies/hooks/useCompany';
import type { Voucher } from '../types/voucher';

/** Print one voucher as a 58mm, 80mm, or A4 ticket and open it in a new tab. */
export function useVoucherTicket() {
  const { data: company } = useCompany();
  const { data: branches } = useBranches();
  const [printing, setPrinting] = useState(false);

  const printTicket = async (voucher: Voucher, size: TicketSize, branchId?: string | null) => {
    setPrinting(true);
    try {
      const branch = (branches ?? []).find((b) => b.id === branchId) ?? null;
      const info = {
        companyName: company?.name ?? 'Hotspot',
        branchName: branch?.name ?? null,
        packageName: voucher.packageName,
        price: null as number | null,
        supportPhone: branch?.phone ?? null,
      };

      let url: string;
      if (size === 'a4') {
        // Reuse the existing A4 builder for a single voucher.
        url = await buildVoucherPdf([voucher], {
          companyName: info.companyName,
          packageName: info.packageName,
          price: info.price,
        });
      } else {
        url = await buildThermalTicket(
          { code: voucher.code, expiresAt: voucher.expiresAt },
          info,
          size,
        );
      }
      window.open(url, '_blank');
    } finally {
      setPrinting(false);
    }
  };

  return { printTicket, printing };
}
