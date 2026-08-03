import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-slate-200/70 dark:bg-slate-800/70',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent',
        className,
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card space-y-3 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card space-y-4 p-5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
