import { config, functionUrl } from '../config.js';

export interface PollCommand {
  id: string;
  command: string;
  params: Record<string, unknown>;
}

export interface PollRouter {
  id: string;
  host: string | null;
  api_port: number;
  username: string | null;
  connection_type: 'agent' | 'direct';
  password: string | null;
}

export interface PollResponse {
  router: PollRouter | null;
  commands: PollCommand[];
}

/** Ask the server for router details + pending commands. */
export async function poll(): Promise<PollResponse> {
  const res = await fetch(functionUrl('agent-poll'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.anonKey}`,
      'x-agent-token': config.agentToken,
    },
    body: '{}',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`poll failed ${res.status}: ${text}`);
  }
  return (await res.json()) as PollResponse;
}
