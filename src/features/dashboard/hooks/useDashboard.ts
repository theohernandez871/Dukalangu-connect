import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => dashboardService.getRecentActivity(),
  });
}
