import { Link } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { ROUTES } from '@/constants/routes';

export function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Umesahau nywila?"
      subtitle="Tutakutumia link ya kubadilisha"
      footer={
        <Link to={ROUTES.login} className="font-semibold text-primary-600 hover:underline">
          Rudi kuingia
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
