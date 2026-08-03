import type { ApexOptions } from 'apexcharts';

const EMERALD = '#059669';
const BLUE = '#2563eb';
const SKY = '#0ea5e9';
const ORANGE = '#f97316';

export const CHART_COLORS = [EMERALD, BLUE, SKY, ORANGE];

/** Base options shared by all charts; merged per-chart. */
export function baseChartOptions(dark: boolean): ApexOptions {
  const grid = dark ? '#1e293b' : '#e2e8f0';
  const text = dark ? '#94a3b8' : '#64748b';
  return {
    chart: {
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: CHART_COLORS,
    grid: { borderColor: grid, strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: { theme: dark ? 'dark' : 'light' },
    legend: { labels: { colors: text }, fontWeight: 600 },
    xaxis: { labels: { style: { colors: text } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: text } } },
  };
}
