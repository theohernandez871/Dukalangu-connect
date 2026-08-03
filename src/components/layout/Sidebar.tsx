import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { SidebarNav } from './SidebarNav';
import { BrandMark } from './BrandMark';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white/60 py-5 backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-slate-900/40 lg:flex',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className={cn('mb-6 flex items-center px-5', collapsed ? 'justify-center' : 'justify-between')}>
        <BrandMark collapsed={collapsed} />
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Kunja menyu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 focus-ring dark:hover:bg-slate-800"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Fungua menyu"
          className="mx-auto mt-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 focus-ring dark:hover:bg-slate-800"
        >
          <ChevronLeftIcon className="h-5 w-5 rotate-180" />
        </button>
      )}
    </aside>
  );
}
