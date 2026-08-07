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
