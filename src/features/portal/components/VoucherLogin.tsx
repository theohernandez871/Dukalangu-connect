import { useState } from 'react';
import { useRedeemVoucher } from '../hooks/usePortal';
import type { RedeemResult } from '../types/portal';

interface VoucherLoginProps {
  slug: string;
  primaryColor: string;
  onSuccess: (result: RedeemResult) => void;
}

export function VoucherLogin({ slug, primaryColor, onSuccess }: VoucherLoginProps) {
  const [code, setCode] = useState('');
  const redeem = useRedeemVoucher(slug);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const clean = code.replace(/\s/g, '');
    if (clean.length < 4) {
      setError('Ingiza namba ya vocha');
      return;
    }
    redeem.mutate(
      { code: clean },
      {
        onSuccess: (res) => {
          if (res.ok) onSuccess(res);
          else setError(res.error ?? 'Imeshindikana');
        },
        onError: () => setError('Tatizo la mtandao. Jaribu tena.'),
      },
    );
  };

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-slate-600">Namba ya vocha</label>
      <input
        inputMode="numeric"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="0000 0000"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-bold tracking-widest text-slate-900 outline-none focus:border-slate-400"
      />

      {error && <p className="mt-3 text-center text-sm font-medium text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={redeem.isPending}
        style={{ backgroundColor: primaryColor }}
        className="mt-4 w-full rounded-2xl py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
      >
        {redeem.isPending ? 'Inathibitisha...' : 'Unganisha'}
      </button>
    </div>
  );
}
