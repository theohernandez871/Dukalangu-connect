import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { ROUTES } from '@/constants/routes';

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'idle' || status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to={ROUTES.dashboard} replace />;

  return <Outlet />;
}
