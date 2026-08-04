import type { UserRole } from '@/types/rbac';

export interface Employee {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface InviteEmployeeInput {
  email: string;
  fullName: string;
  role: UserRole;
  branchId: string;
}
