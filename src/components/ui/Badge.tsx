import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  primary: 'bg-primary-600/10 text-primary-600',
  success: 'bg-success-500/10 text-success-600',
  danger: 'bg-danger-500/10 text-danger-600',
  warning: 'bg-warning-500/10 text-warning-600',
  info: 'bg-info-500/10 text-info-600',
  neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
