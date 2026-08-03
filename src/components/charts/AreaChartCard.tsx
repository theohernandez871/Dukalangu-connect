import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { baseChartOptions } from './chartOptions';
import { useTheme } from '@/hooks/useTheme';

interface AreaChartCardProps {
  title: string;
  subtitle?: string;
  categories: string[];
  series: { name: string; data: number[] }[];
  height?: number;
}

export function AreaChartCard({ title, subtitle, categories, series, height = 300 }: AreaChartCardProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const options = useMemo<ApexOptions>(
    () => ({
      ...baseChartOptions(dark),
      chart: { ...baseChartOptions(dark).chart, type: 'area' },
      stroke: { curve: 'smooth', width: 2.5 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
      },
      xaxis: { ...baseChartOptions(dark).xaxis, categories },
    }),
    [dark, categories],
  );

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <ReactApexChart options={options} series={series} type="area" height={height} />
    </Card>
  );
}
