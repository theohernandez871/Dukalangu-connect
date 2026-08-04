import { Badge } from '@/components/ui/Badge';
import { ROLE_DEFINITIONS } from '@/constants/rbac';
import type { UserRole } from '@/types/rbac';

const ROLE_TONE: Record<UserRole, 'primary' | 'success' | 'info' | 'warning' | 'neutral'> = {
  super_admin: 'primary',
  company_owner: 'primary',
  branch_manager: 'info',
  cashier: 'success',
  technician: 'warning',
  sales_agent: 'success',
  customer: 'neutral',
  guest: 'neutral',
};

export function EmployeeRoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={ROLE_TONE[role]}>{ROLE_DEFINITIONS[role].label}</Badge>;
}
