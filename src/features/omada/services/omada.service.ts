import { omadaRepository } from './omada.repository';
import type {
  OmadaController,
  OmadaControllerInput,
  OmadaConnectionType,
  OmadaStatus,
} from '../types/omada';

interface OmadaRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  name: string;
  connection_type: OmadaConnectionType;
  base_url: string | null;
  omadac_id: string | null;
  site_id: string | null;
  username: string | null;
  status: OmadaStatus;
  last_seen: string | null;
  is_active: boolean;
  created_at: string;
  branch: { name: string } | { name: string }[] | null;
}

function mapController(row: OmadaRow): OmadaController {
  const branch = Array.isArray(row.branch) ? row.branch[0] : row.branch;
  return {
    id: row.id,
    companyId: row.company_id,
    branchId: row.branch_id,
    branchName: branch?.name ?? null,
    name: row.name,
    connectionType: row.connection_type,
    baseUrl: row.base_url,
    omadacId: row.omadac_id,
    siteId: row.site_id,
    username: row.username,
    status: row.status,
    lastSeen: row.last_seen,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const omadaService = {
  async list(companyId: string): Promise<OmadaController[]> {
    const { data, error } = await omadaRepository.list(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => mapController(r as OmadaRow));
  },

  async getById(id: string): Promise<OmadaController> {
    const { data, error } = await omadaRepository.getById(id);
    if (error || !data) throw error ?? new Error('Controller haipatikani');
    return mapController(data as OmadaRow);
  },

  async create(companyId: string, input: OmadaControllerInput): Promise<void> {
    const { data, error } = await omadaRepository.create(companyId, input);
    if (error) throw error;
    if (input.password && data?.id) await omadaRepository.setPassword(data.id, input.password);
  },

  async update(id: string, companyId: string, input: OmadaControllerInput): Promise<void> {
    const { error } = await omadaRepository.update(id, companyId, input);
    if (error) throw error;
    if (input.password) await omadaRepository.setPassword(id, input.password);
  },

  async remove(id: string): Promise<void> {
    const { error } = await omadaRepository.remove(id);
    if (error) throw error;
  },

  async runCommand<T = unknown>(controllerId: string, command: string): Promise<T> {
    const { data, error } = await omadaRepository.runCommand(controllerId, command);
    if (error) throw new Error('Omada proxy imeshindikana');
    if (data?.error) throw new Error(data.error);
    return data.data as T;
  },
};
