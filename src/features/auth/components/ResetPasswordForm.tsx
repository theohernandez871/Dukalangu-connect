import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schemas/auth.schema';
import { useResetPassword } from '@/features/auth/hooks/useAuthMutations';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';

export function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const submit = handleSubmit((values) => {
    reset.mutate(values.password, { onSuccess });
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {reset.isError && <Alert tone="danger">Imeshindikana. Link inaweza kuwa imeisha muda.</Alert>}
      <PasswordInput label="Nywila mpya" error={errors.password?.message} {...register('password')} />
      <PasswordInput
        label="Thibitisha nywila"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" fullWidth isLoading={reset.isPending}>
        Badilisha nywila
      </Button>
    </form>
  );
}
