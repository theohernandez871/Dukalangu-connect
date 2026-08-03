import { Bars3Icon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserMenu } from '@/features/dashboard/components/UserMenu';

interface TopbarProps {
  onOpenMenu: () => void;
  unreadCount?: number;
}

export function Topbar({ onOpenMenu, unreadCount = 0 }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/70 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/50 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Fungua menyu"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-ring dark:hover:bg-slate-800 lg:hidden"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Tafuta..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-3 text-sm focus-ring placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900/60"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Arifa"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-ring dark:hover:bg-slate-800"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
