import { packageRepository } from './package.repository';
import type { Package, PackageInput, PackageType, DurationUnit, TimeWindow } from '../types/package';

interface PackageRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  type: PackageType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_value: number | null;
  duration_unit: DurationUnit | null;
  data_limit_mb: number | null;
  speed_down_kbps: number | null;
  speed_up_kbps: number | null;
  time_window: TimeWindow | null;
  router_profile: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  branch: { name: string } | { name: string }[] | null;
}

function mapPackage(row: PackageRow): Package {
  const branch = Array.isArray(row.branch) ? row.branch[0] : row.branch;
  return {
    id: row.id,
    companyId: row.company_id,
    branchId: row.branch_id,
    branchName: branch?.name ?? null,
    type: row.type,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    durationValue: row.duration_value,
    durationUnit: row.duration_unit,
    dataLimitMb: row.data_limit_mb ? Number(row.data_limit_mb) : null,
    speedDownKbps: row.speed_down_kbps,
    speedUpKbps: row.speed_up_kbps,
    timeWindow: row.time_window,
    routerProfile: row.router_profile,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export const packageService = {
  async list(companyId: string): Promise<Package[]> {
    const { data, error } = await packageRepository.list(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => mapPackage(r as PackageRow));
  },

  async create(companyId: string, input: PackageInput): Promise<void> {
    const { error } = await packageRepository.create(companyId, input);
    if (error) throw error;
  },

  async update(id: string, companyId: string, input: PackageInput): Promise<void> {
    const { error } = await packageRepository.update(id, companyId, input);
    if (error) throw error;
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await packageRepository.setActive(id, isActive);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await packageRepository.remove(id);
    if (error) throw error;
  },
};
