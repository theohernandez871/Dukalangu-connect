/** Format an amount as Tanzanian Shillings. */
export function formatTsh(amount: number): string {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact number formatting: 1200 → 1.2K. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Relative time in Swahili-ish short form. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'sasa hivi';
  if (mins < 60) return `dakika ${mins} zilizopita`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `saa ${hrs} zilizopita`;
  const days = Math.floor(hrs / 24);
  return `siku ${days} zilizopita`;
}
