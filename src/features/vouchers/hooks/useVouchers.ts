import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voucherService } from '../services/voucher.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { GenerateVouchersInput } from '../types/voucher';

export function useBatches() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['voucher-batches', companyId],
    queryFn: () => voucherService.listBatches(companyId),
    enabled: !!companyId,
  });
}

export function useVouchers(batchId?: string, status?: string) {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['vouchers', companyId, batchId ?? 'all', status ?? 'all'],
    queryFn: () => voucherService.listVouchers(companyId, batchId, status),
    enabled: !!companyId,
  });
}

export function useVoucherMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['voucher-batches', companyId] });
    qc.invalidateQueries({ queryKey: ['vouchers', companyId] });
  };

  const generate = useMutation({
    mutationFn: (input: GenerateVouchersInput) => voucherService.generate(input),
    onSuccess: invalidate,
  });
  const quickSell = useMutation({
    mutationFn: (input: GenerateVouchersInput) => voucherService.quickSell(input),
    onSuccess: invalidate,
  });
  const removeBatch = useMutation({
    mutationFn: (id: string) => voucherService.removeBatch(id),
    onSuccess: invalidate,
  });

  return { generate, quickSell, removeBatch };
}
