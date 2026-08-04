import { employeeRepository } from './employee.repository';
import type { Employee, InviteEmployeeInput } from '../types/employee';
import type { UserRole } from '@/types/rbac';

interface EmployeeRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  branch_id: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  branch: { name: string } | { name: string }[] | null;
}

function firstOf<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapEmployee(row: EmployeeRow): Employee {
  const branch = firstOf(row.branch);
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    branchId: row.branch_id,
    branchName: branch?.name ?? null,
    isActive: row.is_active,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
  };
}

export const employeeService = {
  async list(companyId: string): Promise<Employee[]> {
    const { data, error } = await employeeRepository.list(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => mapEmployee(r as EmployeeRow));
  },

  async invite(input: InviteEmployeeInput): Promise<void> {
    const { data, error } = await employeeRepository.invite(input);
    if (error) throw new Error('Mwaliko umeshindikana');
    if (data?.error) throw new Error(data.error);
  },

  async updateRole(id: string, role: UserRole): Promise<void> {
    const { error } = await employeeRepository.updateRole(id, role);
    if (error) throw error;
  },

  async updateBranch(id: string, branchId: string): Promise<void> {
    const { error } = await employeeRepository.updateBranch(id, branchId);
    if (error) throw error;
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await employeeRepository.setActive(id, isActive);
    if (error) throw error;
  },
};
