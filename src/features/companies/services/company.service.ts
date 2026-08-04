import { companyRepository, branchRepository } from './company.repository';
import type { Branch, BranchInput, CompanyDetails } from '../types/company';

interface BranchRow {
  id: string;
  company_id: string;
  name: string;
  location: string | null;
  phone: string | null;
  manager_id: string | null;
  manager: { full_name: string } | { full_name: string }[] | null;
  is_hq: boolean;
  is_active: boolean;
  created_at: string;
}

function mapBranch(row: BranchRow): Branch {
  const manager = Array.isArray(row.manager) ? (row.manager[0] ?? null) : row.manager;
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    location: row.location,
    phone: row.phone,
    managerId: row.manager_id,
    managerName: manager?.full_name ?? null,
    isHq: row.is_hq,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const companyService = {
  async get(companyId: string): Promise<CompanyDetails> {
    const { data, error } = await companyRepository.get(companyId);
    if (error || !data) throw error ?? new Error('Kampuni haikupatikana');
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      ownerId: data.owner_id,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  },

  async update(companyId: string, name: string): Promise<void> {
    const { error } = await companyRepository.update(companyId, name);
    if (error) throw error;
  },
};

export const branchService = {
  async list(companyId: string): Promise<Branch[]> {
    const { data, error } = await branchRepository.list(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => mapBranch(r as BranchRow));
  },

  async create(companyId: string, input: BranchInput): Promise<void> {
    const { error } = await branchRepository.create(companyId, input);
    if (error) throw error;
  },

  async update(id: string, input: BranchInput): Promise<void> {
    const { error } = await branchRepository.update(id, input);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await branchRepository.remove(id);
    if (error) throw error;
  },
};
