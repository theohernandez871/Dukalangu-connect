import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { RegisterPayload } from '@/types/auth';

export type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void;

/**
 * Repository layer: thin wrappers over Supabase.
 * No domain logic here — only data access.
 */
export const authRepository = {
  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signUp(payload: RegisterPayload) {
    return supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          company_name: payload.companyName,
          phone: payload.phone,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  getSession() {
    return supabase.auth.getSession();
  },

  requestPasswordReset(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  },

  updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  resendVerification(email: string) {
    return supabase.auth.resend({ type: 'signup', email });
  },

  fetchProfile(userId: string) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  onAuthStateChange(cb: AuthStateCallback) {
    return supabase.auth.onAuthStateChange(cb);
  },
};
