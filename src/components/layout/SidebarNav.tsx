import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const { hasPermission } = useAuth();

  const visible = NAV_ITEMS.filter(
    (item) => !item.hidden && (!item.permission || hasPermission(item.permission)),
  );

  return (
    <nav className="flex flex-col gap-1 px-3">
      {visible.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && !item.enabled && <Badge tone="neutral">Inakuja</Badge>}
          </>
        );

        if (!item.enabled) {
          return (
            <span
              key={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 dark:text-slate-600',
                collapsed && 'justify-center',
              )}
            >
              {content}
            </span>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-ring',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            {content}
          </NavLink>
        );
      })}
    </nav>
  );
}
