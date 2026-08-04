import { EllipsisVerticalIcon, UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useEmployeeMutations } from '../hooks/useEmployees';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Employee } from '../types/employee';

export function EmployeeActionsMenu({ employee }: { employee: Employee }) {
  const { setActive } = useEmployeeMutations();
  const { session } = useAuth();

  // The owner and yourself cannot be toggled here.
  const isSelf = employee.id === session?.profile.id;
  const isOwner = employee.role === 'company_owner';
  if (isSelf || isOwner) return null;

  return (
    <Dropdown
      trigger={
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </span>
      }
    >
      {employee.isActive ? (
        <DropdownItem tone="danger" onClick={() => setActive.mutate({ id: employee.id, isActive: false })}>
          <UserMinusIcon className="h-4 w-4" /> Zima akaunti
        </DropdownItem>
      ) : (
        <DropdownItem onClick={() => setActive.mutate({ id: employee.id, isActive: true })}>
          <UserPlusIcon className="h-4 w-4" /> Wezesha akaunti
        </DropdownItem>
      )}
    </Dropdown>
  );
}
