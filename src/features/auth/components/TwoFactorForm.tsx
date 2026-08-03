import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { twoFactorSchema, type TwoFactorInput } from '@/features/auth/schemas/auth.schema';
import { mfaService } from '@/features/auth/services/mfa.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';

interface TwoFactorFormProps {
  factorId: string;
  onVerified: () => void;
}

export function TwoFactorForm({ factorId, onVerified }: TwoFactorFormProps) {
  const verify = useMutation({
    mutationFn: (code: string) => mfaService.challengeAndVerify(factorId, code),
    onSuccess: onVerified,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorInput>({ resolver: zodResolver(twoFactorSchema) });

  const submit = handleSubmit((values) => verify.mutate(values.code));

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {verify.isError && <Alert tone="danger">Namba si sahihi. Jaribu tena.</Alert>}
      <Input
        label="Namba ya uthibitisho (6)"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        className="text-center text-lg tracking-[0.5em]"
        error={errors.code?.message}
        {...register('code')}
      />
      <Button type="submit" fullWidth isLoading={verify.isPending}>
        Thibitisha
      </Button>
    </form>
  );
}
