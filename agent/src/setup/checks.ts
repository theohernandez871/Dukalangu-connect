// Connection tests for the Setup Wizard. Each returns a simple {ok, message}
// so the wizard UI can show clear per-check status: internet, backend, MikroTik,
// and token authentication.

import { RouterConnection } from '../router-api/connection.js';
import type { WizardConfig } from '../security/wizardConfig.js';

export interface CheckResult {
  ok: boolean;
  message: string;
}

/** 1. Internet reachable (generic connectivity). */
export async function checkInternet(): Promise<CheckResult> {
  try {
    const res = await fetch('https://api.github.com', { method: 'HEAD' });
    return res.ok || res.status < 500
      ? { ok: true, message: 'Intaneti inapatikana' }
      : { ok: false, message: `Intaneti ina tatizo (HTTP ${res.status})` };
  } catch {
    return { ok: false, message: 'Hakuna intaneti. Angalia muunganisho wa kompyuta.' };
  }
}

/** 2. Backend (Supabase) reachable. */
export async function checkBackend(cfg: Pick<WizardConfig, 'supabaseUrl'>): Promise<CheckResult> {
  if (!cfg.supabaseUrl) return { ok: false, message: 'System URL haijawekwa' };
  try {
    const res = await fetch(`${cfg.supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, { method: 'GET' });
    return res.status < 500
      ? { ok: true, message: 'Backend inapatikana' }
      : { ok: false, message: `Backend ina tatizo (HTTP ${res.status})` };
  } catch {
    return { ok: false, message: 'Imeshindwa kufikia backend. Angalia System URL.' };
  }
}

/** 3. MikroTik reachable + credentials valid (opens a real API session). */
export async function checkMikrotik(
  cfg: Pick<WizardConfig, 'routerHost' | 'routerPort' | 'routerUser' | 'routerPassword'>,
): Promise<CheckResult> {
  if (!cfg.routerHost) return { ok: false, message: 'IP ya MikroTik haijawekwa' };
  const conn = new RouterConnection(
    {
      host: cfg.routerHost,
      port: cfg.routerPort || 8728,
      user: cfg.routerUser,
      password: cfg.routerPassword,
      timeout: 8000,
    },
    'wizard-test',
  );
  try {
    await conn.connect();
    await conn.close();
    return { ok: true, message: 'MikroTik imeunganishwa (API inafanya kazi)' };
  } catch (e) {
    const msg = String(e);
    if (/timed out|ETIMEDOUT|ECONNREFUSED/i.test(msg)) {
      return { ok: false, message: 'Imeshindwa kufikia MikroTik. Angalia IP/port + kwamba kompyuta iko kwenye LAN moja.' };
    }
    if (/login|password|auth|cannot log/i.test(msg)) {
      return { ok: false, message: 'Jina au nenosiri la MikroTik si sahihi.' };
    }
    return { ok: false, message: `MikroTik: ${msg}` };
  }
}

/** 4. Agent token valid (gateway accepts it). */
export async function checkToken(
  cfg: Pick<WizardConfig, 'supabaseUrl' | 'supabaseAnonKey' | 'agentToken'>,
): Promise<CheckResult> {
  if (!cfg.agentToken) return { ok: false, message: 'Token haijawekwa' };
  try {
    const res = await fetch(`${cfg.supabaseUrl.replace(/\/$/, '')}/functions/v1/agent-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-token': cfg.agentToken,
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      },
      body: JSON.stringify({ action: 'poll' }),
    });
    if (res.status === 200) return { ok: true, message: 'Token ni sahihi (imethibitishwa)' };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: 'Token si sahihi au imefutwa. Tengeneza mpya kwenye dashboard.' };
    }
    return { ok: false, message: `Token check: HTTP ${res.status}` };
  } catch {
    return { ok: false, message: 'Imeshindwa kuthibitisha token (angalia backend URL).' };
  }
}
