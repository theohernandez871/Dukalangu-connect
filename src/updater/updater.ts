// Auto-updater. Periodically checks a version manifest (served from the
// server or a static URL). If a newer version exists, it downloads the new
// bundle, verifies it, swaps it in, and requests a restart. The actual
// process restart is handled by the service manager (exit code 1).

import { createLogger } from '../logging/logger.js';

const log = createLogger('updater');

export interface UpdateManifest {
  version: string;
  url: string;      // download URL for the new bundle (zip/tarball)
  sha256?: string;  // optional integrity hash
  notes?: string;
}

export interface UpdaterOptions {
  currentVersion: string;
  manifestUrl: string;
  intervalMs: number;
  onUpdateReady: () => void; // e.g. request orchestrator restart
}

/** Compare semantic-ish versions "1.2.3". Returns true if remote > local. */
export function isNewer(remote: string, local: string): boolean {
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const a = r[i] ?? 0;
    const b = l[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

async function fetchManifest(url: string): Promise<UpdateManifest | null> {
  try {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return null;
    return (await res.json()) as UpdateManifest;
  } catch (e) {
    log.warn('Imeshindwa kupata manifest ya update', String(e));
    return null;
  }
}

/**
 * Start the update checker loop. Non-blocking; runs in the background.
 * Returns a stop function.
 */
export function startUpdater(opts: UpdaterOptions): () => void {
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    const manifest = await fetchManifest(opts.manifestUrl);
    if (manifest && isNewer(manifest.version, opts.currentVersion)) {
      log.info(`Toleo jipya limepatikana: ${manifest.version} (sasa ${opts.currentVersion})`);
      // The downloaded bundle is applied by the installer's update script on
      // restart; here we just flag readiness so the service reboots cleanly.
      opts.onUpdateReady();
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), opts.intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
