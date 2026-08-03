import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'success' | 'danger' | 'warning' | 'info';

const tones: Record<Tone, string> = {
  success: 'bg-success-500/10 text-success-600 border-success-500/30',
  danger: 'bg-danger-500/10 text-danger-600 border-danger-500/30',
  warning: 'bg-warning-500/10 text-warning-600 border-warning-500/30',
  info: 'bg-info-500/10 text-info-600 border-info-500/30',
};

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={cn('rounded-xl border px-4 py-3 text-sm font-medium', tones[tone])}
    >
      {children}
    </div>
  );
}
