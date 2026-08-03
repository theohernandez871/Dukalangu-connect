import { createContext } from 'react';
import type { AuthSession, AuthStatus } from '@/types/auth';
import type { Permission } from '@/types/rbac';

export interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  hasPermission: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
