import { useState } from 'react';
import { portalService } from '../services/portal.service';
import type { PortalPackage } from '../types/portal';

interface Props {
  slug: string;
  pkg: PortalPackage | null;
  primaryColor: string;
  onClose: () => void;
}

type Phase = 'form' | 'sending' | 'waiting' | 'error';

/** Collects the customer's phone and starts a Snippe mobile-money payment.
 *  After the USSD push, the customer authorises on their phone; the voucher is
 *  delivered by the webhook (Module 3B). */
export function PurchaseDialog({ slug, pkg, primaryColor, onClose }: Props) {
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);

  if (!pkg) return null;

  const pay = async () => {
    if (!/^0\d{9}$/.test(phone.trim())) {
      setError('Weka namba sahihi, mfano 0712345678');
      return;
    }
    setPhase('sending');
    setError(null);
    const res = await portalService.createPayment({ slug, packageId: pkg.id, phone: phone.trim() });
    if (res.ok) {
      setPhase('waiting');
    } else {
      setError(res.error ?? 'Malipo yameshindwa. Jaribu tena.');
      setPhase('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-900">{pkg.name}</p>
            <p className="text-lg font-bold" style={{ color: primaryColor }}>
              TSH {pkg.price.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400" aria-label="Funga">✕</button>
        </div>

        {phase === 'waiting' ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: primaryColor }} />
            <p className="font-medium text-slate-800">Angalia simu yako</p>
            <p className="mt-1 text-sm text-slate-500">
              Umepokea ombi la USSD. Weka PIN yako kukamilisha malipo. Voucher yako itatumwa mara malipo yatakapothibitishwa.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600"
            >
              Funga
            </button>
          </div>
        ) : (
          <>
            <label className="text-sm text-slate-600">Namba ya simu (M-Pesa, Airtel, Mixx, Halotel)</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg focus:border-slate-400 focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={pay}
              disabled={phase === 'sending'}
              className="mt-4 w-full rounded-xl py-3 font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {phase === 'sending' ? 'Inatuma ombi...' : `Lipa TSH ${pkg.price.toLocaleString()}`}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Utapokea ombi la USSD kwenye simu yako kukamilisha malipo.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
