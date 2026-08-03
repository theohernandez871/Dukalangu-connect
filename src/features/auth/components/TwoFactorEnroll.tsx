import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { mfaService } from '@/features/auth/services/mfa.service';
import { TwoFactorForm } from '@/features/auth/components/TwoFactorForm';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/feedback/Alert';

interface EnrollState {
  factorId: string;
  qrCode: string;
  secret: string;
}

export function TwoFactorEnroll({ onEnrolled }: { onEnrolled: () => void }) {
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const start = useMutation({ mutationFn: () => mfaService.enroll(), onSuccess: setEnroll });

  useEffect(() => {
    start.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (start.isPending || !enroll) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-6 w-6 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Changanua QR kwa app kama Google Authenticator, kisha weka namba ya uthibitisho.
      </p>
      <div className="flex justify-center">
        <div
          className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700"
          dangerouslySetInnerHTML={{ __html: enroll.qrCode }}
        />
      </div>
      <Alert tone="info">
        Siri (weka mwenyewe ikibidi): <span className="font-mono">{enroll.secret}</span>
      </Alert>
      <TwoFactorForm factorId={enroll.factorId} onVerified={onEnrolled} />
    </div>
  );
}
