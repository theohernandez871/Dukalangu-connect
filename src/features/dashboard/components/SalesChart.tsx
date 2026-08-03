import { Suspense } from 'react';
import { LazyDonutChartCard, ChartFallback } from '@/components/charts/LazyCharts';

export function SalesChart() {
  // Package sales breakdown is wired in Phase 6/9. For now: empty.
  return (
    <Suspense fallback={<ChartFallback />}>
      <LazyDonutChartCard
        title="Mauzo kwa kifurushi"
        subtitle="Itaunganishwa Phase 6"
        labels={['Saa', 'Data', 'Usiku', 'Wiki']}
        series={[0, 0, 0, 0]}
      />
    </Suspense>
  );
}
