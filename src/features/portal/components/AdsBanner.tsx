import { useEffect, useState } from 'react';
import type { PortalAd } from '../types/portal';

/** Simple auto-rotating ad banner. Tapping opens the ad link. */
export function AdsBanner({ ads }: { ads: PortalAd[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const ad = ads[index];

  const content = (
    <img src={ad.image_url} alt={ad.title ?? 'Tangazo'} className="h-full w-full object-cover" />
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
      <div className="aspect-[16/6] w-full">
        {ad.link_url ? (
          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block h-full">
            {content}
          </a>
        ) : (
          content
        )}
      </div>
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {ads.map((_, i) => (
            <span
              key={i}
              className={'h-1.5 rounded-full transition-all ' + (i === index ? 'w-4 bg-slate-500' : 'w-1.5 bg-slate-300')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
