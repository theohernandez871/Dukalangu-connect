import { authRepository } from '@/features/auth/services/auth.repository';
import { mapProfile, type ProfileRow } from '@/features/auth/services/profile.mapper';
import { resolvePermissions } from '@/constants/rbac';
import type { AuthSession, RegisterPayload } from '@/types/auth';
import { normalizeTzPhone } from '@/utils/format';

/** Raised for any auth failure so the UI can show a friendly message. */
export class AuthError extends Error {}

async function buildSession(userId: string): Promise<AuthSession> {
  const { data, error } = await authRepository.fetchProfile(userId);
  if (error || !data) throw new AuthError('Imeshindwa kupata taarifa za mtumiaji');
  const profile = mapProfile(data as ProfileRow);
  return { profile, permissions: resolvePermissions(profile.role) };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await authRepository.signIn(email, password);
    if (error) throw new AuthError(translateError(error.message));
    if (!data.user) throw new AuthError('Kuingia kumeshindikana');
    return buildSession(data.user.id);
  },

  async register(payload: RegisterPayload): Promise<void> {
    const normalized = { ...payload, phone: normalizeTzPhone(payload.phone) };
    const { error } = await authRepository.signUp(normalized);
    if (error) throw new AuthError(translateError(error.message));
  },

  async logout(): Promise<void> {
    await authRepository.signOut();
  },

  async getCurrentSession(): Promise<AuthSession | null> {
    const { data } = await authRepository.getSession();
    if (!data.session?.user) return null;
    return buildSession(data.session.user.id);
  },

  async forgotPassword(email: string): Promise<void> {
    const { error } = await authRepository.requestPasswordReset(email);
    if (error) throw new AuthError(translateError(error.message));
  },

  async resetPassword(password: string): Promise<void> {
    const { error } = await authRepository.updatePassword(password);
    if (error) throw new AuthError(translateError(error.message));
  },

  async resendVerification(email: string): Promise<void> {
    const { error } = await authRepository.resendVerification(email);
    if (error) throw new AuthError(translateError(error.message));
  },
};

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Barua pepe au nywila si sahihi';
  if (m.includes('email not confirmed')) return 'Thibitisha barua pepe yako kwanza';
  if (m.includes('already registered')) return 'Barua pepe hii tayari imesajiliwa';
  if (m.includes('rate limit')) return 'Umejaribu mara nyingi. Subiri kidogo';
  return message;
}
