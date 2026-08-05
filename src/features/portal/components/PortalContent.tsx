import type { PortalOffer, PortalAnnouncement } from '../types/portal';

export function OffersList({ offers, primaryColor }: { offers: PortalOffer[]; primaryColor: string }) {
  if (offers.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Ofa</h2>
      <div className="space-y-2">
        {offers.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900">{o.title}</p>
                {o.badge && (
                  <span style={{ backgroundColor: primaryColor }} className="rounded-full px-2 py-0.5 text-xs font-medium text-white">
                    {o.badge}
                  </span>
                )}
              </div>
              {o.description && <p className="mt-0.5 text-sm text-slate-500">{o.description}</p>}
            </div>
            {o.promo_price != null && (
              <p className="shrink-0 text-lg font-bold" style={{ color: primaryColor }}>
                TSH {o.promo_price.toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const LEVEL_STYLES: Record<string, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-100',
  warning: 'bg-amber-50 text-amber-800 border-amber-100',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
};

export function AnnouncementsList({ items }: { items: PortalAnnouncement[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id} className={'rounded-2xl border p-4 ' + (LEVEL_STYLES[a.level] ?? LEVEL_STYLES.info)}>
          <p className="font-semibold">{a.title}</p>
          {a.body && <p className="mt-0.5 text-sm opacity-90">{a.body}</p>}
        </div>
      ))}
    </div>
  );
}
