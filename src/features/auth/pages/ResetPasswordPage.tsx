import { useNavigate } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { ROUTES } from '@/constants/routes';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  return (
    <AuthShell title="Nywila mpya" subtitle="Weka nywila yako mpya salama">
      <ResetPasswordForm onSuccess={() => navigate(ROUTES.login)} />
    </AuthShell>
  );
}
