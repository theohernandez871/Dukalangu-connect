import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schemas/auth.schema';
import { useForgotPassword } from '@/features/auth/hooks/useAuthMutations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const submit = handleSubmit((values) => forgot.mutate(values.email));

  if (forgot.isSuccess) {
    return <Alert tone="success">Tumekutumia link ya kubadilisha nywila kwenye barua pepe yako.</Alert>;
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {forgot.isError && <Alert tone="danger">Imeshindikana kutuma. Jaribu tena.</Alert>}
      <Input
        label="Barua pepe"
        type="email"
        autoComplete="email"
        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
        placeholder="wewe@mfano.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" fullWidth isLoading={forgot.isPending}>
        Tuma link
      </Button>
    </form>
  );
}
