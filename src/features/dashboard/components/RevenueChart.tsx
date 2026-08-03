import { Suspense } from 'react';
import { LazyAreaChartCard, ChartFallback } from '@/components/charts/LazyCharts';

/** Last 7 days labels in Swahili short day names. */
const DAYS = ['Jum2', 'Jum4', 'Jumt', 'Ijm', 'Jmt', 'Jpl', 'Leo'];

export function RevenueChart() {
  // Revenue data is wired in Phase 9 (Payments). For now: zeros.
  const series = [{ name: 'Mapato (TSH)', data: [0, 0, 0, 0, 0, 0, 0] }];

  return (
    <Suspense fallback={<ChartFallback />}>
      <LazyAreaChartCard
        title="Mwenendo wa mapato"
        subtitle="Siku 7 zilizopita — itaunganishwa Phase 9"
        categories={DAYS}
        series={series}
      />
    </Suspense>
  );
}
