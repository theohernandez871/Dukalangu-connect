import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payoutService } from '../services/payout.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { NewPayout } from '../types/payout';

export function usePayouts() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['payouts', companyId],
    queryFn: () => payoutService.list(),
    enabled: !!companyId,
  });
}

export function usePayoutBalance() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['payout-balance', companyId],
    queryFn: () => payoutService.balance(),
    enabled: !!companyId,
  });
}

export function usePayoutActions() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payouts'] });
    qc.invalidateQueries({ queryKey: ['payout-balance'] });
  };

  const create = useMutation({
    mutationFn: (input: NewPayout) => payoutService.create(input, companyId),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => payoutService.remove(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
