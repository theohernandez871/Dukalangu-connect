import { supabase } from '@/lib/supabase';

/**
 * Two-Factor Authentication using Supabase MFA (TOTP).
 * Enrollment returns a QR/secret; verification confirms the factor.
 */
export const mfaService = {
  async enroll() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code, // SVG data URI
      secret: data.totp.secret,
    };
  },

  async challengeAndVerify(factorId: string, code: string) {
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) throw challenge.error;
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });
    if (error) throw error;
  },

  async getAssuranceLevel() {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    return data;
  },

  async listFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data.totp;
  },
};
