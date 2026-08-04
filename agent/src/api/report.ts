import { config, functionUrl } from '../config.js';

export interface CommandResult {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface RouterStatusReport {
  status?: 'online' | 'offline' | 'error';
  os_version?: string;
  model?: string;
  cpu_load?: number;
  mem_used?: number;
}

/** Send command results and/or router status back to the server. */
export async function report(payload: {
  results?: CommandResult[];
  status?: RouterStatusReport;
}): Promise<void> {
  const res = await fetch(functionUrl('agent-report'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.anonKey}`,
      'x-agent-token': config.agentToken,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`report failed ${res.status}: ${text}`);
  }
}
