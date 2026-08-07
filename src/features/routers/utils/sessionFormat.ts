/** Format a byte count string from RouterOS into human-readable KB/MB/GB. */
export function formatBytes(raw?: string): string {
  if (!raw) return '—';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return '0 MB';
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/** Remaining data = limit-bytes-total minus (in + out); '—' if no limit set. */
export function formatRemainingData(active: {
  'limit-bytes-total'?: string;
  'bytes-in'?: string;
  'bytes-out'?: string;
}): string {
  const limit = Number(active['limit-bytes-total'] ?? 0);
  if (!Number.isFinite(limit) || limit <= 0) return 'Bila kikomo';
  const used = Number(active['bytes-in'] ?? 0) + Number(active['bytes-out'] ?? 0);
  const left = Math.max(0, limit - used);
  return formatBytes(String(left));
}

/** Remaining time left in the session; '—'/unlimited when absent. */
export function formatTimeLeft(raw?: string): string {
  if (!raw || raw === '0s') return 'Bila kikomo';
  return raw;
}
