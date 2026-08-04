import { agentRepository, commandRepository } from './agent.repository';
import type { RouterAgent, CreatedAgent, RouterCommand, CommandStatus } from '../types/agent';

interface AgentRow {
  id: string;
  router_id: string | null;
  name: string;
  last_ping: string | null;
  is_active: boolean;
  created_at: string;
}

function mapAgent(row: AgentRow): RouterAgent {
  return {
    id: row.id,
    routerId: row.router_id,
    name: row.name,
    lastPing: row.last_ping,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const agentService = {
  async list(companyId: string): Promise<RouterAgent[]> {
    const { data, error } = await agentRepository.list(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => mapAgent(r as AgentRow));
  },

  async create(name: string, routerId: string | null): Promise<CreatedAgent> {
    const { data, error } = await agentRepository.create(name, routerId);
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { agentId: row.agent_id, rawToken: row.raw_token };
  },

  async revoke(agentId: string): Promise<void> {
    const { error } = await agentRepository.revoke(agentId);
    if (error) throw error;
  },
};

export const commandService = {
  async enqueue(routerId: string, command: string): Promise<string> {
    const { data, error } = await commandRepository.enqueue(routerId, command);
    if (error) throw error;
    return data as string;
  },

  async enqueueWithParams(
    routerId: string,
    command: string,
    params: Record<string, unknown>,
  ): Promise<string> {
    const { data, error } = await commandRepository.enqueue(routerId, command, params);
    if (error) throw error;
    return data as string;
  },

  async get(commandId: string): Promise<RouterCommand> {
    const { data, error } = await commandRepository.get(commandId);
    if (error || !data) throw error ?? new Error('Command haipatikani');
    return {
      id: data.id,
      routerId: data.router_id,
      command: data.command,
      status: data.status as CommandStatus,
      result: data.result,
      error: data.error,
      createdAt: data.created_at,
      finishedAt: data.finished_at,
    };
  },
};
