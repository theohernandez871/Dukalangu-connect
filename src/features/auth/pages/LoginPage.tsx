import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ROUTES } from '@/constants/routes';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Karibu tena"
      subtitle="Ingia kwenye akaunti yako"
      footer={
        <>
          Huna akaunti?{' '}
          <Link to={ROUTES.register} className="font-semibold text-primary-600 hover:underline">
            Jisajili
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate(ROUTES.dashboard)} />
      <div className="mt-4 text-center">
        <Link to={ROUTES.forgotPassword} className="text-sm text-slate-500 hover:text-primary-600">
          Umesahau nywila?
        </Link>
      </div>
    </AuthShell>
  );
}
