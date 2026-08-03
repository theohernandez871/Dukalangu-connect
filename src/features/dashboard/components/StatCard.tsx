import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

type Accent = 'primary' | 'accent' | 'info' | 'warning' | 'success' | 'danger';

const accents: Record<Accent, string> = {
  primary: 'bg-primary-600/10 text-primary-600',
  accent: 'bg-accent-600/10 text-accent-600',
  info: 'bg-info-500/10 text-info-600',
  warning: 'bg-warning-500/10 text-warning-600',
  success: 'bg-success-500/10 text-success-600',
  danger: 'bg-danger-500/10 text-danger-600',
};

interface StatCardProps {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent?: Accent;
  /** When true, shows a subtle "Inakuja" tag for not-yet-wired metrics. */
  pending?: boolean;
  index?: number;
}

export function StatCard({ label, value, icon: Icon, accent = 'primary', pending, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
            {pending && <Badge tone="neutral">Inakuja</Badge>}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accents[accent])}>
          <Icon className="h-6 w-6" />
        </div>
      </Card>
    </motion.div>
  );
}
