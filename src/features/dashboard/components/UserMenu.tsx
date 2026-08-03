import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_DEFINITIONS } from '@/constants/rbac';

export function UserMenu() {
  const { session, logout } = useAuth();
  if (!session) return null;

  const { profile } = session;
  const roleLabel = ROLE_DEFINITIONS[profile.role].label;

  return (
    <Dropdown
      trigger={
        <span className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
          <Avatar name={profile.fullName || profile.email} src={profile.avatarUrl} size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block max-w-32 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profile.fullName || profile.email}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{roleLabel}</span>
          </span>
          <ChevronDownIcon className="h-4 w-4 text-slate-400" />
        </span>
      }
    >
      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {profile.fullName || 'Mtumiaji'}
        </p>
        <p className="truncate text-xs text-slate-500">{profile.email}</p>
      </div>
      <DropdownItem>
        <UserCircleIcon className="h-4 w-4" /> Wasifu
      </DropdownItem>
      <DropdownItem tone="danger" onClick={() => logout()}>
        <ArrowRightOnRectangleIcon className="h-4 w-4" /> Toka
      </DropdownItem>
    </Dropdown>
  );
}
