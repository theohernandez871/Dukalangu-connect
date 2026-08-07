import type { PortalPackage } from '../types/portal';

function formatDuration(v: number | null, unit: string | null): string {
  if (!v || !unit) return '';
  const map: Record<string, string> = {
    minute: 'dakika', hour: 'saa', day: 'siku', week: 'wiki', month: 'mwezi',
  };
  return `${v} ${map[unit] ?? unit}`;
}

function formatData(mb: number | null): string {
  if (!mb || mb <= 0) return 'Bila kikomo';
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}

function formatSpeed(kbps: number | null): string | null {
  if (!kbps || kbps <= 0) return null;
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(kbps % 1000 === 0 ? 0 : 1)} Mbps`;
  return `${kbps} Kbps`;
}

interface Props {
  packages: PortalPackage[];
  primaryColor: string;
  busyId: string | null;
  onBuy: (pkg: PortalPackage) => void;
}

/** Customer-facing package store. Each package shows price, speed, duration,
 *  data, and a "Nunua" button that starts the purchase flow. */
export function PackageStore({ packages, primaryColor, busyId, onBuy }: Props) {
  if (packages.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
        Nunua Kifurushi
      </h2>
      {packages.map((p) => {
        const speed = formatSpeed(p.speed_down_kbps);
        return (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{p.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {[formatDuration(p.duration_value, p.duration_unit), formatData(p.data_limit_mb), speed]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {p.description && <p className="mt-1 text-xs text-slate-400">{p.description}</p>}
              </div>
              <p className="shrink-0 text-lg font-bold" style={{ color: primaryColor }}>
                TSH {p.price.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onBuy(p)}
              disabled={busyId === p.id}
              className="mt-3 w-full rounded-xl py-2.5 font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {busyId === p.id ? 'Inasubiri...' : 'Nunua'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
