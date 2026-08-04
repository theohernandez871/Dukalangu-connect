// Minimal Omada Controller API client.
// Flow: login -> receive token + session cookie -> call endpoints.
// Works with Omada Software/Hardware Controller (v5) reachable by URL.

interface OmadaSession {
  token: string;
  cookie: string;
}

export interface OmadaConfig {
  baseUrl: string;   // https://host:8043
  omadacId: string;  // controller id
  site: string;      // site id
  username: string;
  password: string;
}

async function login(cfg: OmadaConfig): Promise<OmadaSession> {
  const url = `${cfg.baseUrl}/${cfg.omadacId}/api/v2/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
  });
  const cookie = res.headers.get('set-cookie') ?? '';
  const body = await res.json();
  if (body.errorCode !== 0) throw new Error(body.msg ?? 'Omada login imeshindikana');
  return { token: body.result?.token ?? '', cookie };
}

async function apiGet(cfg: OmadaConfig, session: OmadaSession, path: string): Promise<unknown> {
  const url = `${cfg.baseUrl}/${cfg.omadacId}/api/v2${path}`;
  const res = await fetch(url, {
    headers: { 'Csrf-Token': session.token, Cookie: session.cookie },
  });
  const body = await res.json();
  if (body.errorCode !== 0) throw new Error(body.msg ?? 'Omada API imeshindikana');
  return body.result;
}

/** Map our command keys to Omada API paths (site-scoped). */
function pathFor(cfg: OmadaConfig, command: string): string {
  const s = `/sites/${cfg.site}`;
  switch (command) {
    case 'omada.devices': return `${s}/devices`;
    case 'omada.aps': return `${s}/devices`; // filtered client-side to APs
    case 'omada.clients': return `${s}/clients?currentPage=1&currentPageSize=100`;
    case 'omada.status': return `${s}/dashboard/overviewDiagram`;
    default: throw new Error(`Command haijulikani: ${command}`);
  }
}

export async function runOmadaCommand(cfg: OmadaConfig, command: string): Promise<unknown> {
  const session = await login(cfg);
  return apiGet(cfg, session, pathFor(cfg, command));
}
