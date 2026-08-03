import type { UserRole, Permission } from '@/types/rbac';

export interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  companyId: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

/** The fully resolved auth session used across the app. */
export interface AuthSession {
  profile: Profile;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  password: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
