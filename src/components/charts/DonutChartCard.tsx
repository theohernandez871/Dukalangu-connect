import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { baseChartOptions } from './chartOptions';
import { useTheme } from '@/hooks/useTheme';

interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  labels: string[];
  series: number[];
  height?: number;
}

export function DonutChartCard({ title, subtitle, labels, series, height = 300 }: DonutChartCardProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const options = useMemo<ApexOptions>(
    () => ({
      ...baseChartOptions(dark),
      chart: { ...baseChartOptions(dark).chart, type: 'donut' },
      labels,
      stroke: { width: 0 },
      plotOptions: { pie: { donut: { size: '68%' } } },
      legend: { ...baseChartOptions(dark).legend, position: 'bottom' },
    }),
    [dark, labels],
  );

  const isEmpty = series.every((v) => v === 0);

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {isEmpty ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
          Hakuna data bado
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="donut" height={height} />
      )}
    </Card>
  );
}
