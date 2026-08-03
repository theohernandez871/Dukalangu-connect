/**
 * Role-Based Access Control (RBAC) type definitions.
 * These roles map 1:1 to the Postgres `user_role` enum.
 */

export const USER_ROLES = [
  'super_admin',
  'company_owner',
  'branch_manager',
  'cashier',
  'technician',
  'sales_agent',
  'customer',
  'guest',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Granular permissions. Format: `resource:action`.
 * Kept as string union for strict typing at call sites.
 */
export type Permission =
  | 'company:manage'
  | 'company:view'
  | 'branch:manage'
  | 'branch:view'
  | 'employee:manage'
  | 'employee:view'
  | 'router:manage'
  | 'router:view'
  | 'package:manage'
  | 'package:view'
  | 'voucher:manage'
  | 'voucher:view'
  | 'payment:manage'
  | 'payment:view'
  | 'report:view'
  | 'settings:manage'
  | 'audit:view';

export interface RoleDefinition {
  role: UserRole;
  label: string;
  description: string;
  /** Whether 2FA is mandatory for this role. */
  requires2FA: boolean;
}
