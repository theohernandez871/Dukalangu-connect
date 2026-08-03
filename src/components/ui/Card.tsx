import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  padded?: boolean;
}

export function Card({ glass = true, padded = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-shadow',
        glass
          ? 'glass shadow-glass'
          : 'bg-white shadow-soft dark:bg-slate-900 dark:border-slate-800',
        padded && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
