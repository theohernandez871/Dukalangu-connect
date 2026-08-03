import type { ComponentType, ReactNode } from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = InboxIcon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
