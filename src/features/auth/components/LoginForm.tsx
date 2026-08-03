import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { loginSchema, type LoginInput } from '@/features/auth/schemas/auth.schema';
import { useLogin } from '@/features/auth/hooks/useAuthMutations';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { AuthError } from '@/features/auth/services/auth.service';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const submit = handleSubmit((values) => {
    login.mutate(values, { onSuccess });
  });

  const errorMsg =
    login.error instanceof AuthError ? login.error.message : login.error ? 'Hitilafu imetokea' : null;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errorMsg && <Alert tone="danger">{errorMsg}</Alert>}
      <Input
        label="Barua pepe"
        type="email"
        autoComplete="email"
        placeholder="wewe@mfano.com"
        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordInput
        label="Nywila"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" fullWidth isLoading={login.isPending}>
        Ingia
      </Button>
    </form>
  );
}
