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
};
