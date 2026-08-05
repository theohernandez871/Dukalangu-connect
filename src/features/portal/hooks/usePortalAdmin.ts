import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portalAdminRepository as repo } from '../services/portal.admin.repository';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PortalSettings, PortalAd, PortalOffer, PortalAnnouncement } from '../types/portal';

function useCompanyId(): string {
  const { session } = useAuth();
  return session?.profile.companyId ?? '';
}

export function usePortalSettings() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['portal-settings', companyId],
    queryFn: async () => {
      await repo.ensureSettings(companyId);
      const { data, error } = await repo.getSettings(companyId);
      if (error) throw error;
      return data as PortalSettings | null;
    },
    enabled: !!companyId,
  });
}

export function usePortalSettingsMutation() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (patch: Partial<PortalSettings>) => {
      const { error } = await repo.updateSettings(companyId, patch);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-settings', companyId] }),
  });
}

function useList<T>(key: string, fn: (c: string) => PromiseLike<{ data: unknown; error: unknown }>) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: [key, companyId],
    queryFn: async () => {
      const { data, error } = await fn(companyId);
      if (error) throw error;
      return (data ?? []) as T[];
    },
    enabled: !!companyId,
  });
}

export function useAds() {
  return useList<PortalAd>('portal-ads', (c) => repo.listAds(c));
}
export function useOffers() {
  return useList<PortalOffer>('portal-offers', (c) => repo.listOffers(c));
}
export function useAnnouncements() {
  return useList<PortalAnnouncement>('portal-announcements', (c) => repo.listAnnouncements(c));
}

/** Generic mutations for a portal child resource (ads/offers/announcements). */
export function usePortalResource(kind: 'ads' | 'offers' | 'announcements') {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  const key = `portal-${kind}`;
  const invalidate = () => qc.invalidateQueries({ queryKey: [key, companyId] });

  const save = useMutation({
    mutationFn: async (item: Record<string, unknown> & { id?: string }) => {
      const res =
        kind === 'ads' ? await repo.saveAd(companyId, item)
        : kind === 'offers' ? await repo.saveOffer(companyId, item)
        : await repo.saveAnnouncement(companyId, item);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res =
        kind === 'ads' ? await repo.removeAd(id)
        : kind === 'offers' ? await repo.removeOffer(id)
        : await repo.removeAnnouncement(id);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });

  return { save, remove };
}
