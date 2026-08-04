export interface RouterAgent {
  id: string;
  routerId: string | null;
  name: string;
  lastPing: string | null;
  isActive: boolean;
  createdAt: string;
}

export type CommandStatus = 'pending' | 'running' | 'done' | 'failed' | 'timeout';

export interface RouterCommand {
  id: string;
  routerId: string;
  command: string;
  status: CommandStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface CreatedAgent {
  agentId: string;
  rawToken: string;
}
