import { supabase } from '@/lib/supabase';
import type { PackageInput } from '../types/package';

function toRow(companyId: string, input: PackageInput) {
  return {
    company_id: companyId,
    branch_id: input.branchId || null,
    type: input.type,
    name: input.name,
    description: input.description || null,
    price: input.price,
    duration_value: input.durationValue ?? null,
    duration_unit: input.durationUnit ?? null,
    data_limit_mb: input.dataLimitMb ?? null,
    speed_down_kbps: input.speedDownKbps ?? null,
    speed_up_kbps: input.speedUpKbps ?? null,
    time_window: input.timeWindow ?? null,
    router_profile: input.routerProfile || null,
    validity_days: input.validityDays ?? null,
    is_active: input.isActive ?? true,
  };
}

export const packageRepository = {
  list(companyId: string) {
    return supabase
      .from('packages')
      .select('*, branch:branch_id(name)')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
  },

  create(companyId: string, input: PackageInput) {
    return supabase.from('packages').insert(toRow(companyId, input));
  },

  update(id: string, companyId: string, input: PackageInput) {
    return supabase.from('packages').update(toRow(companyId, input)).eq('id', id);
  },

  setActive(id: string, isActive: boolean) {
    return supabase.from('packages').update({ is_active: isActive }).eq('id', id);
  },

  remove(id: string) {
    return supabase.from('packages').delete().eq('id', id);
  },
};
