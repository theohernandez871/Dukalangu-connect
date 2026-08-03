import { PageHeader } from '@/components/layout/PageHeader';
import { StatGrid } from '../components/StatGrid';
import { RevenueChart } from '../components/RevenueChart';
import { SalesChart } from '../components/SalesChart';
import { RouterStatusWidget } from '../components/RouterStatusWidget';
import { RecentActivity } from '../components/RecentActivity';
import { useAuth } from '@/features/auth/hooks/useAuth';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Habari za asubuhi';
  if (h < 16) return 'Habari za mchana';
  if (h < 19) return 'Habari za jioni';
  return 'Habari za usiku';
}

export function DashboardPage() {
  const { session } = useAuth();
  const name = session?.profile.fullName?.split(' ')[0] ?? '';

  return (
    <div>
      <PageHeader
        title={`${greeting()}${name ? ', ' + name : ''}`}
        subtitle="Muhtasari wa mfumo wako wa Hotspot"
      />

      <StatGrid />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <SalesChart />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RouterStatusWidget />
        <RecentActivity />
      </div>
    </div>
  );
}
