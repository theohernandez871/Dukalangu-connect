import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useVoucherReport(branchId?: string | null) {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['voucher-report', companyId, branchId ?? 'all'],
    queryFn: () => reportService.getVoucherReport(branchId),
    enabled: !!companyId,
  });
}

export function useBranchReports() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['branch-reports', companyId],
    queryFn: () => reportService.getBranchReports(),
    enabled: !!companyId,
  });
}
