import { Spinner } from '@/components/ui/Spinner';

export function FullPageLoader({ label = 'Inapakia...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
