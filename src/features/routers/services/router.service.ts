import { supabase } from '@/lib/supabase';
import { routerRepository } from './router.repository';
import type { Router, RouterInput, RouterStatus, RouterConnectionType } from '../types/router';

interface RouterRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  name: string;
  connection_type: RouterConnectionType;
  host: string | null;
  api_port: number;
  username: string | null;
  status: RouterStatus;
  os_version: string | null;
  model: string | null;
  last_seen: string | null;
  cpu_load: number | null;
  mem_used: number | null;
  mem_total: number | null;
  uptime: string | null;
  board_name: string | null;
  connected_users: number | null;
  ping_ms: number | null;
  response_ms: number | null;
  is_active: boolean;
  created_at: string;
  branch: { name: string } | { name: string }[] | null;
}

function mapRouter(row: RouterRow): Router {
  const branch = Array.isArray(row.branch) ? row.branch[0] : row.branch;
  return {
    id: row.id,
    companyId: row.company_id,
    branchId: row.branch_id,
    branchName: branch?.name ?? null,
    name: row.name,
    connectionType: row.connection_type,
    host: row.host,
    apiPort: row.api_port,
    username: row.username,
    status: row.status,
    osVersion: row.os_version,
    model: row.model,
    lastSeen: row.last_seen,
    cpuLoad: row.cpu_load,
    memUsed: row.mem_used ? Number(row.mem_used) : null,
    memTotal: row.mem_total ? Number(row.mem_total) : null,
    uptime: row.uptime,
    boardName: row.board_name,
    connectedUsers: row.connected_users,
    pingMs: row.ping_ms,
    responseMs: row.response_ms,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const routerService = {
  async list(companyId: string): Promise<Router[]> {
    const { data, error } = await routerRepository.list(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => mapRouter(r as RouterRow));
  },

  async getById(id: string): Promise<Router> {
    const { data, error } = await routerRepository.getById(id);
    if (error || !data) throw error ?? new Error('Router haipatikani');
    return mapRouter(data as RouterRow);
  },

  async create(companyId: string, input: RouterInput): Promise<void> {
    const { data, error } = await routerRepository.create(companyId, input);
    if (error) throw error;
    // Store password securely if provided (Edge Function encrypts).
    if (input.password && data?.id) {
      await routerRepository.setPassword(data.id, input.password);
    }
  },

  async update(id: string, companyId: string, input: RouterInput): Promise<void> {
    const { error } = await routerRepository.update(id, companyId, input);
    if (error) throw error;
    if (input.password) {
      await routerRepository.setPassword(id, input.password);
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await routerRepository.remove(id);
    if (error) throw error;
  },

  /** Mark routers offline whose heartbeat has gone stale (fallback for no-cron). */
  async sweepOffline(): Promise<void> {
    await supabase.rpc('mark_stale_routers_offline', { p_threshold_seconds: 90 });
  },
};
