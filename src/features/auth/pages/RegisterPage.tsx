import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { Alert } from '@/components/feedback/Alert';
import { ROUTES } from '@/constants/routes';
import { maskEmail } from '@/utils/format';

export function RegisterPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  if (registeredEmail) {
    return (
      <AuthShell
        title="Thibitisha barua pepe"
        subtitle="Tumekutumia link ya uthibitisho"
        footer={
          <Link to={ROUTES.login} className="font-semibold text-primary-600 hover:underline">
            Rudi kuingia
          </Link>
        }
      >
        <Alert tone="success">
          Tumetuma link kwenye {maskEmail(registeredEmail)}. Fungua barua pepe yako uthibitishe akaunti.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Fungua akaunti"
      subtitle="Anzisha kampuni yako ya Hotspot"
      footer={
        <>
          Una akaunti tayari?{' '}
          <Link to={ROUTES.login} className="font-semibold text-primary-600 hover:underline">
            Ingia
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={setRegisteredEmail} />
    </AuthShell>
  );
}
