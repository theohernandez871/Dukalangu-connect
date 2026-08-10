import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PaymentStatus } from '../types/payment';

export function usePayments(status?: PaymentStatus, search?: string) {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['payments', companyId, status ?? 'all', search ?? ''],
    queryFn: () => paymentService.list(status, search),
    enabled: !!companyId,
  });
}

export function usePaymentSummary() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['payment-summary', companyId],
    queryFn: () => paymentService.summary(),
    enabled: !!companyId,
  });
}
