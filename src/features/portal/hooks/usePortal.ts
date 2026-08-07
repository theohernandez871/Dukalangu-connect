import { useMutation, useQuery } from '@tanstack/react-query';
import { portalService } from '../services/portal.service';

export function usePortal(slug: string) {
  return useQuery({
    queryKey: ['portal', slug],
    queryFn: () => portalService.load(slug),
    enabled: !!slug,
    retry: 0,
  });
}

export function usePortalPackages(slug: string) {
  return useQuery({
    queryKey: ['portal-packages', slug],
    queryFn: () => portalService.loadPackages(slug),
    enabled: !!slug,
    retry: 0,
  });
}

export function useRedeemVoucher(slug: string) {
  return useMutation({
    mutationFn: (vars: { code: string; mac?: string | null }) =>
      portalService.redeem(slug, vars.code, vars.mac),
  });
}
