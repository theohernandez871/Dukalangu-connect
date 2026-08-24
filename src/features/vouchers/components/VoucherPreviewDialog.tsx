import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { CopyButton } from '@/components/ui/CopyButton';
import { qrDataUrl, barcodeDataUrl, formatCode } from '../utils/codes';
import type { Voucher } from '../types/voucher';

interface VoucherPreviewDialogProps {
  voucher: Voucher | null;
  onClose: () => void;
}

export function VoucherPreviewDialog({ voucher, onClose }: VoucherPreviewDialogProps) {
  const [qr, setQr] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');

  useEffect(() => {
    if (!voucher) return;
    qrDataUrl(voucher.code).then(setQr);
    try {
      setBarcode(barcodeDataUrl(voucher.code));
    } catch {
      setBarcode('');
    }
  }, [voucher]);

  return (
    <Dialog open={!!voucher} onClose={onClose} title="Vocha" size="sm">
      {voucher && (
        <div className="flex flex-col items-center gap-4 text-center">
          {qr && <img src={qr} alt="QR" className="h-40 w-40" />}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold tracking-wider text-slate-900 dark:text-white">
              {formatCode(voucher.code)}
            </span>
            <CopyButton value={voucher.code} />
          </div>
          {barcode && <img src={barcode} alt="Barcode" className="h-12" />}
          {voucher.packageName && (
            <p className="text-sm text-slate-500">{voucher.packageName}</p>
          )}
        </div>
      )}
    </Dialog>
  );
}
