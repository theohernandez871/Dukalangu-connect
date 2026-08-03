import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Hitilafu imetokea',
  description = 'Imeshindikana kupakia data. Jaribu tena.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/10 text-danger-600">
        <ExclamationTriangleIcon className="h-7 w-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Jaribu tena
        </Button>
      )}
    </div>
  );
}
