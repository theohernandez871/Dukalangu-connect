import {
  UsersIcon,
  UserGroupIcon,
  SignalIcon,
  SignalSlashIcon,
  BanknotesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { StatCard } from './StatCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { useDashboardStats } from '../hooks/useDashboard';
import { formatTsh } from '@/utils/currency';

export function StatGrid() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard index={0} label="Watumiaji wote" value={String(data.totalUsers)} icon={UsersIcon} accent="primary" />
      <StatCard index={1} label="Watumiaji hai" value={String(data.activeUsers)} icon={UserGroupIcon} accent="success" />
      <StatCard index={2} label="Online sasa" value={String(data.onlineUsers)} icon={SignalIcon} accent="info" pending />
      <StatCard index={3} label="Offline" value={String(data.offlineUsers)} icon={SignalSlashIcon} accent="warning" pending />
      <StatCard index={4} label="Mapato leo" value={formatTsh(data.revenueToday)} icon={BanknotesIcon} accent="accent" pending />
      <StatCard index={5} label="Mapato mwezi" value={formatTsh(data.revenueMonth)} icon={CalendarDaysIcon} accent="accent" pending />
    </div>
  );
}
