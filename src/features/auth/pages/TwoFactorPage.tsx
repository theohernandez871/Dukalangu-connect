import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { TwoFactorForm } from '@/features/auth/components/TwoFactorForm';
import { TwoFactorEnroll } from '@/features/auth/components/TwoFactorEnroll';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { mfaService } from '@/features/auth/services/mfa.service';
import { ROUTES } from '@/constants/routes';

type Mode = 'loading' | 'enroll' | 'verify';

export function TwoFactorPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    mfaService.listFactors().then((factors) => {
      const verified = factors.find((f) => f.status === 'verified');
      if (verified) {
        setFactorId(verified.id);
        setMode('verify');
      } else {
        setMode('enroll');
      }
    });
  }, []);

  const done = () => navigate(ROUTES.dashboard);

  if (mode === 'loading') return <FullPageLoader />;

  return (
    <AuthShell
      title={mode === 'enroll' ? 'Sanidi 2FA' : 'Uthibitisho wa hatua mbili'}
      subtitle={mode === 'enroll' ? 'Ongeza usalama kwenye akaunti yako' : 'Weka namba kutoka app yako'}
    >
      {mode === 'enroll' ? (
        <TwoFactorEnroll onEnrolled={done} />
      ) : (
        factorId && <TwoFactorForm factorId={factorId} onVerified={done} />
      )}
    </AuthShell>
  );
}
