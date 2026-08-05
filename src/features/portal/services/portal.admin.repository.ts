import { supabase } from '@/lib/supabase';
import type { PortalSettings, PortalAd, PortalOffer, PortalAnnouncement } from '../types/portal';

/** Admin-side portal management (RLS restricts to the caller's company). */
export const portalAdminRepository = {
  // Settings (single row per company)
  getSettings(companyId: string) {
    return supabase.from('portal_settings').select('*').eq('company_id', companyId).maybeSingle();
  },
  ensureSettings(companyId: string) {
    return supabase.rpc('ensure_portal_settings', { p_company_id: companyId });
  },
  updateSettings(companyId: string, patch: Partial<PortalSettings>) {
    return supabase.from('portal_settings').update(patch).eq('company_id', companyId);
  },

  // Ads
  listAds(companyId: string) {
    return supabase.from('portal_ads').select('*').eq('company_id', companyId).order('sort_order');
  },
  saveAd(companyId: string, ad: Partial<PortalAd> & { id?: string }) {
    const row = { company_id: companyId, title: ad.title, image_url: ad.image_url, link_url: ad.link_url, sort_order: ad.sort_order ?? 0 };
    return ad.id
      ? supabase.from('portal_ads').update(row).eq('id', ad.id)
      : supabase.from('portal_ads').insert(row);
  },
  removeAd(id: string) {
    return supabase.from('portal_ads').delete().eq('id', id);
  },

  // Offers
  listOffers(companyId: string) {
    return supabase.from('portal_offers').select('*').eq('company_id', companyId).order('sort_order');
  },
  saveOffer(companyId: string, o: Partial<PortalOffer> & { id?: string }) {
    const row = {
      company_id: companyId, package_id: o.package_id || null, title: o.title,
      description: o.description, promo_price: o.promo_price ?? null, badge: o.badge, sort_order: o.sort_order ?? 0,
    };
    return o.id
      ? supabase.from('portal_offers').update(row).eq('id', o.id)
      : supabase.from('portal_offers').insert(row);
  },
  removeOffer(id: string) {
    return supabase.from('portal_offers').delete().eq('id', id);
  },

  // Announcements
  listAnnouncements(companyId: string) {
    return supabase.from('portal_announcements').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  },
  saveAnnouncement(companyId: string, a: Partial<PortalAnnouncement> & { id?: string }) {
    const row = { company_id: companyId, title: a.title, body: a.body, level: a.level ?? 'info' };
    return a.id
      ? supabase.from('portal_announcements').update(row).eq('id', a.id)
      : supabase.from('portal_announcements').insert(row);
  },
  removeAnnouncement(id: string) {
    return supabase.from('portal_announcements').delete().eq('id', id);
  },
};
