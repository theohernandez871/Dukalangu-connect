import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Badilisha mandhari"
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus-ring dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
