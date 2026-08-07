import { supabase } from '@/lib/supabase';
import type { PortalData, PortalPackage, RedeemResult } from '../types/portal';

/**
 * Public portal service. Uses SECURITY DEFINER RPCs callable by `anon`, so no
 * admin auth is required — customers on the hotspot can reach these.
 */
export const portalService = {
  async load(slug: string): Promise<PortalData | null> {
    const { data, error } = await supabase.rpc('get_portal', { p_slug: slug });
    if (error) throw error;
    return (data as PortalData) ?? null;
  },

  async loadPackages(slug: string): Promise<PortalPackage[]> {
    const { data, error } = await supabase.rpc('portal_packages', { p_slug: slug });
    if (error) throw error;
    return (data as PortalPackage[]) ?? [];
  },

  /** Start a mobile-money purchase. Calls the create-payment Edge Function,
   *  which validates price server-side and triggers the USSD push. */
  async createPayment(input: {
    slug: string;
    packageId: string;
    phone: string;
    routerId?: string | null;
  }): Promise<{ ok: boolean; transactionId?: string; reference?: string; message?: string; error?: string }> {
    const { data, error } = await supabase.functions.invoke('snippe-create-payment', {
      body: input,
    });
    if (error) {
      // Edge errors may carry a JSON body with a friendly message.
      const ctx = (error as { context?: { error?: string } }).context;
      return { ok: false, error: ctx?.error ?? error.message };
    }
    return data as { ok: boolean; transactionId?: string; reference?: string; message?: string };
  },

  async redeem(slug: string, code: string, mac?: string | null): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('portal_redeem_voucher', {
      p_slug: slug,
      p_code: code,
      p_mac: mac ?? null,
    });
    if (error) throw error;
    return data as RedeemResult;
  },
};
