// Local Setup Wizard server. Runs on 127.0.0.1 only (never exposed to the
// network), so the customer opens a simple form in their browser instead of
// editing .env. Handles: serve form, run connection tests, save config.
//
// No external web framework — Node's built-in http keeps the agent small.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadWizardConfig, saveWizardConfig, type WizardConfig } from '../security/wizardConfig.js';
import { checkInternet, checkBackend, checkMikrotik, checkToken } from './checks.js';
import { WIZARD_HTML } from './wizardHtml.js';

const HOST = '127.0.0.1';

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

/** Start the wizard server. Returns the chosen port. */
export function startWizardServer(port = 3500): Promise<number> {
  const server = createServer(async (req, res) => {
    try {
      const url = req.url ?? '/';

      // Serve the form.
      if (req.method === 'GET' && (url === '/' || url.startsWith('/index'))) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(WIZARD_HTML);
        return;
      }

      // Return current (non-secret) config to prefill the form.
      if (req.method === 'GET' && url === '/api/config') {
        const cfg = await loadWizardConfig();
        json(res, 200, {
          agentName: cfg.agentName ?? '',
          supabaseUrl: cfg.supabaseUrl ?? '',
          supabaseAnonKey: cfg.supabaseAnonKey ?? '',
          routerHost: cfg.routerHost ?? '',
          routerPort: cfg.routerPort ?? 8728,
          routerUser: cfg.routerUser ?? '',
          // token + password intentionally omitted from prefill for safety
          hasToken: Boolean(cfg.agentToken),
          hasPassword: Boolean(cfg.routerPassword),
          configured: Boolean(cfg.configured),
        });
        return;
      }

      // Run the four connection checks against submitted values.
      if (req.method === 'POST' && url === '/api/test') {
        const body = (await readBody(req)) as Partial<WizardConfig>;
        const merged = await mergeWithSaved(body);
        const [internet, backend, mikrotik, token] = await Promise.all([
          checkInternet(),
          checkBackend(merged),
          checkMikrotik(merged),
          checkToken(merged),
        ]);
        json(res, 200, { internet, backend, mikrotik, token });
        return;
      }

      // Save the config securely.
      if (req.method === 'POST' && url === '/api/save') {
        const body = (await readBody(req)) as Partial<WizardConfig>;
        const merged = await mergeWithSaved(body);
        if (!merged.supabaseUrl || !merged.agentToken || !merged.routerHost) {
          json(res, 400, { ok: false, error: 'System URL, Token na MikroTik IP vinahitajika.' });
          return;
        }
        await saveWizardConfig({ ...merged, configured: true } as WizardConfig);
        json(res, 200, { ok: true, message: 'Imehifadhiwa! Funga dirisha hili, kisha endesha install-service.bat (kama Administrator) kusakinisha Agent ya 24/7.' });
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    } catch (e) {
      json(res, 500, { ok: false, error: String(e) });
    }
  });

  return new Promise((resolve) => {
    server.listen(port, HOST, () => resolve(port));
  });
}

/** Merge submitted values over saved ones, so blank password/token fields keep
 *  the existing saved secret instead of wiping it. */
async function mergeWithSaved(body: Partial<WizardConfig>): Promise<WizardConfig> {
  const saved = await loadWizardConfig();
  return {
    agentName: body.agentName ?? saved.agentName ?? 'Agent',
    supabaseUrl: (body.supabaseUrl ?? saved.supabaseUrl ?? '').trim(),
    supabaseAnonKey: (body.supabaseAnonKey ?? saved.supabaseAnonKey ?? '').trim(),
    agentToken: (body.agentToken || saved.agentToken || '').trim(),
    routerHost: (body.routerHost ?? saved.routerHost ?? '').trim(),
    routerPort: Number(body.routerPort ?? saved.routerPort ?? 8728),
    routerUser: (body.routerUser ?? saved.routerUser ?? '').trim(),
    routerPassword: body.routerPassword || saved.routerPassword || '',
    configured: true,
  };
}
