import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserIcon, BuildingOffice2Icon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas/auth.schema';
import { useRegister } from '@/features/auth/hooks/useAuthMutations';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { AuthError } from '@/features/auth/services/auth.service';

export function RegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const submit = handleSubmit((values) => {
    const { confirmPassword: _omit, ...payload } = values;
    registerMutation.mutate(payload, { onSuccess: () => onSuccess(values.email) });
  });

  const errorMsg =
    registerMutation.error instanceof AuthError
      ? registerMutation.error.message
      : registerMutation.error
        ? 'Hitilafu imetokea'
        : null;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errorMsg && <Alert tone="danger">{errorMsg}</Alert>}
      <Input
        label="Jina kamili"
        leftIcon={<UserIcon className="h-5 w-5" />}
        placeholder="Baruth Mtemi"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Jina la kampuni"
        leftIcon={<BuildingOffice2Icon className="h-5 w-5" />}
        placeholder="Urambo Net Ltd"
        error={errors.companyName?.message}
        {...register('companyName')}
      />
      <Input
        label="Barua pepe"
        type="email"
        autoComplete="email"
        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
        placeholder="wewe@mfano.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Namba ya simu"
        leftIcon={<PhoneIcon className="h-5 w-5" />}
        placeholder="0765 000 000"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <PasswordInput label="Nywila" error={errors.password?.message} {...register('password')} />
      <PasswordInput
        label="Thibitisha nywila"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" fullWidth isLoading={registerMutation.isPending}>
        Fungua akaunti
      </Button>
    </form>
  );
}
