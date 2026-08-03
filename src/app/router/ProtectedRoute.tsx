import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { ROUTES } from '@/constants/routes';

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'idle' || status === 'loading') return <FullPageLoader />;
  if (status === 'unauthenticated') return <Navigate to={ROUTES.login} replace />;

  return <Outlet />;
}
