import type { UserRole, Permission, RoleDefinition } from '@/types/rbac';

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Platform-wide administrator.',
    requires2FA: true,
  },
  company_owner: {
    role: 'company_owner',
    label: 'Mmiliki wa Kampuni',
    description: 'Owns and manages the company.',
    requires2FA: true,
  },
  branch_manager: {
    role: 'branch_manager',
    label: 'Meneja wa Tawi',
    description: 'Manages a single branch.',
    requires2FA: true,
  },
  cashier: {
    role: 'cashier',
    label: 'Keshia',
    description: 'Handles sales and payments.',
    requires2FA: false,
  },
  technician: {
    role: 'technician',
    label: 'Fundi',
    description: 'Manages routers and devices.',
    requires2FA: false,
  },
  sales_agent: {
    role: 'sales_agent',
    label: 'Wakala wa Mauzo',
    description: 'Sells vouchers and packages.',
    requires2FA: false,
  },
  customer: {
    role: 'customer',
    label: 'Mteja',
    description: 'End WiFi customer.',
    requires2FA: false,
  },
  guest: {
    role: 'guest',
    label: 'Mgeni',
    description: 'Unauthenticated portal visitor.',
    requires2FA: false,
  },
};

/** Base permission sets, composed to avoid repetition. */
const OWNER_PERMS: Permission[] = [
  'company:manage', 'company:view', 'branch:manage', 'branch:view',
  'employee:manage', 'employee:view', 'router:manage', 'router:view',
  'package:manage', 'package:view', 'voucher:manage', 'voucher:view',
  'payment:manage', 'payment:view', 'report:view', 'settings:manage', 'audit:view',
];

const MANAGER_PERMS: Permission[] = [
  'branch:view', 'employee:view', 'router:manage', 'router:view',
  'package:manage', 'package:view', 'voucher:manage', 'voucher:view',
  'payment:manage', 'payment:view', 'report:view',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: OWNER_PERMS,
  company_owner: OWNER_PERMS,
  branch_manager: MANAGER_PERMS,
  cashier: ['payment:manage', 'payment:view', 'voucher:view', 'package:view'],
  technician: ['router:manage', 'router:view'],
  sales_agent: ['voucher:manage', 'voucher:view', 'package:view', 'payment:view'],
  customer: [],
  guest: [],
};

export function resolvePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
