import { lazy } from 'react';
import { ChartSkeleton } from '@/components/ui/Skeleton';

/**
 * ApexCharts is heavy (~600kB). Lazy-load the chart cards so it lands
 * in its own async chunk instead of bloating the dashboard route.
 */
export const LazyAreaChartCard = lazy(() =>
  import('./AreaChartCard').then((m) => ({ default: m.AreaChartCard })),
);

export const LazyDonutChartCard = lazy(() =>
  import('./DonutChartCard').then((m) => ({ default: m.DonutChartCard })),
);

export function ChartFallback() {
  return <ChartSkeleton />;
}
