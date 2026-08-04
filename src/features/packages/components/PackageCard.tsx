import { WifiIcon, ClockIcon, BoltIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PackageTypeBadge } from './PackageTypeBadge';
import { formatTsh } from '@/utils/currency';
import { formatDuration, formatData, formatSpeed } from '../utils/format';
import type { Package } from '../types/package';

function Line({ icon: Icon, text }: { icon: typeof ClockIcon; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <Icon className="h-4 w-4 text-slate-400" />
      {text}
    </div>
  );
}

export function PackageCard({ pkg, onClick }: { pkg: Package; onClick?: () => void }) {
  return (
    <Card className="flex flex-col gap-3" onClick={onClick} glass={false}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 dark:text-white">{pkg.name}</h3>
          <div className="mt-1"><PackageTypeBadge type={pkg.type} /></div>
        </div>
        {!pkg.isActive && <Badge tone="neutral">Imezimwa</Badge>}
      </div>

      <p className="text-2xl font-bold text-primary-600">{formatTsh(pkg.price)}</p>

      <div className="space-y-1.5">
        <Line icon={ClockIcon} text={formatDuration(pkg)} />
        <Line icon={CircleStackIcon} text={formatData(pkg.dataLimitMb)} />
        {pkg.speedDownKbps != null && (
          <Line icon={BoltIcon} text={`${formatSpeed(pkg.speedDownKbps)} / ${formatSpeed(pkg.speedUpKbps)}`} />
        )}
        {pkg.branchName && <Line icon={WifiIcon} text={pkg.branchName} />}
      </div>
    </Card>
  );
}
