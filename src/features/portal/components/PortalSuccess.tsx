import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { RedeemResult } from '../types/portal';

export function PortalSuccess({ result, primaryColor }: { result: RedeemResult; primaryColor: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <CheckCircleIcon className="h-20 w-20" style={{ color: primaryColor }} />
      <h2 className="mt-4 text-2xl font-bold text-slate-900">Umeunganishwa!</h2>
      <p className="mt-2 text-slate-500">
        Vocha yako imekubaliwa{result.package ? ` — ${result.package}` : ''}.
      </p>
      {result.activated ? (
        <p className="mt-1 text-sm text-slate-400">Intaneti yako iko tayari kutumika.</p>
      ) : (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Vocha imekubaliwa. Kama intaneti haijaanza, subiri sekunde chache au wasiliana na msaada.
        </p>
      )}
    </div>
  );
}
