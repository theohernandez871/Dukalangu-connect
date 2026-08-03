import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useResendVerification } from '@/features/auth/hooks/useAuthMutations';
import { authService } from '@/features/auth/services/auth.service';
import { ROUTES } from '@/constants/routes';

type Status = 'checking' | 'verified' | 'pending';

export function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [email, setEmail] = useState('');
  const resend = useResendVerification();

  useEffect(() => {
    // Supabase parses the token from the URL automatically (detectSessionInUrl).
    authService.getCurrentSession().then((session) => {
      setStatus(session?.profile.emailVerified ? 'verified' : 'pending');
    });
  }, []);

  return (
    <AuthShell
      title="Uthibitisho wa barua pepe"
      footer={
        <Link to={ROUTES.login} className="font-semibold text-primary-600 hover:underline">
          Rudi kuingia
        </Link>
      }
    >
      {status === 'verified' && (
        <Alert tone="success">Barua pepe yako imethibitishwa! Sasa unaweza kuingia.</Alert>
      )}
      {status === 'pending' && (
        <div className="space-y-4">
          <Alert tone="warning">Barua pepe bado haijathibitishwa. Tuma tena link.</Alert>
          <Input
            label="Barua pepe"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="wewe@mfano.com"
          />
          {resend.isSuccess && <Alert tone="success">Tumetuma tena. Angalia barua pepe.</Alert>}
          <Button fullWidth isLoading={resend.isPending} onClick={() => resend.mutate(email)}>
            Tuma tena link
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
