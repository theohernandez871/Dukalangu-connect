import { CheckIcon } from '@heroicons/react/20/solid';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmployeeRoleBadge } from '@/features/employees/components/EmployeeRoleBadge';
import { ROLE_PERMISSIONS } from '@/constants/rbac';
import { USER_ROLES, type Permission } from '@/types/rbac';

const ALL_PERMISSIONS: Permission[] = [
  'company:manage', 'branch:manage', 'employee:manage', 'router:manage',
  'package:manage', 'voucher:manage', 'payment:manage', 'report:view',
  'settings:manage', 'audit:view',
];

// Roles worth displaying (exclude guest/customer which have none).
const DISPLAY_ROLES = USER_ROLES.filter((r) => r !== 'guest' && r !== 'customer');

export function PermissionsPage() {
  return (
    <div>
      <PageHeader title="Ruhusa (Permissions)" subtitle="Ramani ya majukumu na ruhusa zake" />
      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left font-semibold text-slate-500">Ruhusa</th>
              {DISPLAY_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center">
                  <EmployeeRoleBadge role={role} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((perm) => (
              <tr key={perm} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{perm}</td>
                {DISPLAY_ROLES.map((role) => (
                  <td key={role} className="px-3 py-3 text-center">
                    {ROLE_PERMISSIONS[role].includes(perm) ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-success-600" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
