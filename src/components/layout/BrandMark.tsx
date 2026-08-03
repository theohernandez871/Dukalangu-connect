import { WifiIcon } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';

export function BrandMark({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-soft">
        <WifiIcon className="h-5 w-5" />
      </div>
      {!collapsed && <span className="text-lg font-bold text-gradient">Hotspot</span>}
    </div>
  );
}
