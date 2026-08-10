import { useEffect, useState } from 'react';

// Import images as assets so Vite bundles + fingerprints them for production.
import tz01 from '@/assets/auth-bg/tz-01.jpg';
import tz02 from '@/assets/auth-bg/tz-02.jpg';
import tz03 from '@/assets/auth-bg/tz-03.jpg';
import tz04 from '@/assets/auth-bg/tz-04.jpg';
import tz05 from '@/assets/auth-bg/tz-05.jpg';
import tz06 from '@/assets/auth-bg/tz-06.jpg';
import tz07 from '@/assets/auth-bg/tz-07.jpg';
import tz08 from '@/assets/auth-bg/tz-08.jpg';
import tz09 from '@/assets/auth-bg/tz-09.jpg';

const IMAGES = [tz01, tz02, tz03, tz04, tz05, tz06, tz07, tz08, tz09];
const INTERVAL_MS = 6000;

interface Props {
  /** Overlay darkness 0-1 (default 0.55) so foreground text stays readable. */
  overlay?: number;
}

/**
 * Full-screen background slideshow with a smooth crossfade every 6s, looping
 * continuously. Each image is a stacked layer; only the active one is opaque,
 * so the transition is a true crossfade rather than a hard cut. The interval is
 * cleared on unmount to avoid memory leaks.
 */
export function BackgroundSlideshow({ overlay = 0.55 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id); // cleanup prevents memory leaks
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
          }}
          aria-hidden
        />
      ))}
      {/* Dark gradient overlay for legibility of the card + text on top. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(2,6,23,${overlay * 0.9}), rgba(2,6,23,${overlay}))`,
        }}
        aria-hidden
      />
    </div>
  );
}
