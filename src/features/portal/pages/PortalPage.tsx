import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePortal, usePortalPackages } from '../hooks/usePortal';
import { VoucherLogin } from '../components/VoucherLogin';
import { AdsBanner } from '../components/AdsBanner';
import { OffersList, AnnouncementsList } from '../components/PortalContent';
import { PortalSuccess } from '../components/PortalSuccess';
import { PackageStore } from '../components/PackageStore';
import type { PortalPackage, RedeemResult } from '../types/portal';

const DEFAULT_COLOR = '#059669';

export function PortalPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = usePortal(slug);
  const { data: packages } = usePortalPackages(slug);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onBuy = (pkg: PortalPackage) => {
    // Module 2 delivers the store UI. The actual payment gateway (Snippe) is
    // wired in Module 3 — until then, buying explains what will happen.
    setBuying(pkg.id);
    setNotice(`Malipo ya "${pkg.name}" (TSH ${pkg.price.toLocaleString()}) yatapatikana hivi karibuni. Kwa sasa tumia voucher.`);
    setTimeout(() => setBuying(null), 400);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Portal haipatikani</h1>
          <p className="mt-2 text-slate-500">Anwani si sahihi au portal imezimwa.</p>
        </div>
      </div>
    );
  }

  const { settings, ads, offers, announcements } = data;
  const color = settings.primary_color || DEFAULT_COLOR;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
        {/* Header / branding */}
        <div className="flex flex-col items-center text-center">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.brand_name ?? ''} className="h-16 w-16 rounded-2xl object-contain" />
          ) : (
            <div style={{ backgroundColor: color }} className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white">
              {(settings.brand_name ?? 'W')[0]}
            </div>
          )}
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{settings.brand_name ?? 'WiFi'}</h1>
          {settings.welcome_title && <p className="mt-1 font-medium text-slate-600">{settings.welcome_title}</p>}
        </div>

        {announcements.length > 0 && <AnnouncementsList items={announcements} />}
        {ads.length > 0 && <AdsBanner ads={ads} />}

        {/* Login card */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {result?.ok ? (
            <PortalSuccess result={result} primaryColor={color} />
          ) : (
            <>
              {settings.welcome_message && (
                <p className="mb-4 text-center text-sm text-slate-500">{settings.welcome_message}</p>
              )}
              <VoucherLogin slug={slug} primaryColor={color} onSuccess={setResult} />
            </>
          )}
        </div>

        {!result?.ok && (
          <>
            {notice && (
              <div className="rounded-2xl bg-amber-50 p-3 text-center text-sm text-amber-800">
                {notice}
              </div>
            )}
            <PackageStore
              packages={packages ?? []}
              primaryColor={color}
              busyId={buying}
              onBuy={onBuy}
            />
            <OffersList offers={offers} primaryColor={color} />
          </>
        )}

        <div className="mt-auto pt-4 text-center text-xs text-slate-400">
          {settings.support_phone && <p>Msaada: {settings.support_phone}</p>}
          <p className="mt-1">Inaendeshwa na {settings.brand_name ?? 'Hotspot Billing'}</p>
        </div>
      </div>
    </div>
  );
}
