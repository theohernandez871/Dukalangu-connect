import { useMutation } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RegisterPayload } from '@/types/auth';

export function useLogin() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      authService.login(vars.email, vars.password),
    onSuccess: () => refresh(),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (password: string) => authService.resetPassword(password),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authService.resendVerification(email),
  });
}
