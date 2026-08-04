import type { Package } from '../types/package';
import { DURATION_UNIT_LABELS } from '../constants/packageMeta';

/** Human-readable duration, e.g. "3 Saa". */
export function formatDuration(pkg: Package): string {
  if (!pkg.durationValue || !pkg.durationUnit) return '—';
  return `${pkg.durationValue} ${DURATION_UNIT_LABELS[pkg.durationUnit]}`;
}

/** Human-readable data cap, e.g. "500 MB" or "2 GB"; unlimited when null. */
export function formatData(mb: number | null): string {
  if (mb == null) return 'Bila kikomo';
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}

/** Human-readable speed, e.g. "5 Mbps" from kbps. */
export function formatSpeed(kbps: number | null): string {
  if (kbps == null) return '—';
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(kbps % 1000 === 0 ? 0 : 1)} Mbps`;
  return `${kbps} kbps`;
}
