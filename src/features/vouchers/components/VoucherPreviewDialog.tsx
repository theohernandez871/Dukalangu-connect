import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { CopyButton } from '@/components/ui/CopyButton';
import { qrDataUrl, formatCode } from '../utils/codes';
import type { Voucher } from '../types/voucher';

interface VoucherPreviewDialogProps {
  voucher: Voucher | null;
  onClose: () => void;
}

/** Row of label + value with a copy button. */
function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-slate-900 dark:text-white">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function VoucherPreviewDialog({ voucher, onClose }: VoucherPreviewDialogProps) {
  const [qr, setQr] = useState<string>('');

  // Username and password both equal the voucher code (hotspot user created on
  // the router with name=code, password=code). The QR encodes both so a phone
  // scan reveals the full login, not just the code.
  useEffect(() => {
    if (!voucher) return;
    const payload = `Username: ${voucher.code}\nPassword: ${voucher.code}`;
    qrDataUrl(payload).then(setQr);
  }, [voucher]);

  const expire = voucher?.expiresAt
    ? new Date(voucher.expiresAt).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <Dialog open={!!voucher} onClose={onClose} title="Vocha" size="sm">
      {voucher && (
        <div className="flex flex-col items-center gap-4">
          {qr && <img src={qr} alt="QR" className="h-40 w-40" />}

          <p className="font-mono text-2xl font-bold tracking-wider text-slate-900 dark:text-white">
            {formatCode(voucher.code)}
          </p>

          <div className="w-full space-y-2">
            <CredRow label="Username" value={voucher.code} />
            <CredRow label="Password" value={voucher.code} />
            {voucher.packageName && <CredRow label="Profile" value={voucher.packageName} />}
            {expire && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                <span className="text-sm text-slate-500">Muda wa kuisha</span>
                <span className="font-medium text-slate-900 dark:text-white">{expire}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Ingiza Username na Password kwenye ukurasa wa hotspot ili kuunganisha.
          </p>
        </div>
      )}
    </Dialog>
  );
}
