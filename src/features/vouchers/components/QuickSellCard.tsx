import { BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { formatTsh } from '@/utils/currency';
import { formatDuration, formatData } from '@/features/packages/utils/format';
import type { Package } from '@/features/packages/types/package';

interface Props {
  pkg: Package;
  selling: boolean;
  disabled: boolean;
  onSell: (pkg: Package) => void;
}

/** One package tile with an instant "Uza" (sell) button for Quick Sell. */
export function QuickSellCard({ pkg, selling, disabled, onSell }: Props) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex-1">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{pkg.name}</p>
        <p className="mt-1 text-2xl font-bold text-primary-600">{formatTsh(pkg.price)}</p>
        <p className="mt-2 text-sm text-slate-500">
          {formatDuration(pkg)} · {formatData(pkg.dataLimitMb)}
        </p>
        {pkg.routerProfile && (
          <p className="mt-1 text-xs text-slate-400">Profile: {pkg.routerProfile}</p>
        )}
      </div>
      <Button className="mt-4 w-full" isLoading={selling} disabled={disabled} onClick={() => onSell(pkg)}>
        <BoltIcon className="h-4 w-4" /> Uza
      </Button>
    </div>
  );
}
