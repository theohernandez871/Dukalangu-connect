import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';
import { authService } from '@/features/auth/services/auth.service';
import { authRepository } from '@/features/auth/services/auth.repository';
import type { AuthSession, AuthStatus } from '@/types/auth';
import type { Permission } from '@/types/rbac';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const next = await authService.getCurrentSession();
      setSession(next);
      setStatus(next ? 'authenticated' : 'unauthenticated');
    } catch {
      setSession(null);
      setStatus('unauthenticated');
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    void refresh();
    const { data } = authRepository.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setStatus('unauthenticated');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const hasPermission = useCallback(
    (permission: Permission) => session?.permissions.includes(permission) ?? false,
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ session, status, hasPermission, refresh, logout }),
    [session, status, hasPermission, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
