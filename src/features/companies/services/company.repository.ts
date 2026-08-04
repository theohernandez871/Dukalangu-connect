import { supabase } from '@/lib/supabase';
import type { BranchInput } from '../types/company';

export const companyRepository = {
  get(companyId: string) {
    return supabase.from('companies').select('*').eq('id', companyId).single();
  },

  update(companyId: string, name: string) {
    return supabase.from('companies').update({ name, updated_at: new Date().toISOString() }).eq('id', companyId);
  },
};

export const branchRepository = {
  list(companyId: string) {
    return supabase
      .from('branches')
      .select('*, manager:manager_id(full_name)')
      .eq('company_id', companyId)
      .order('is_hq', { ascending: false })
      .order('created_at', { ascending: true });
  },

  create(companyId: string, input: BranchInput) {
    return supabase.from('branches').insert({
      company_id: companyId,
      name: input.name,
      location: input.location ?? null,
      phone: input.phone ?? null,
      manager_id: input.managerId ?? null,
    });
  },

  update(id: string, input: BranchInput) {
    return supabase
      .from('branches')
      .update({
        name: input.name,
        location: input.location ?? null,
        phone: input.phone ?? null,
        manager_id: input.managerId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  },

  remove(id: string) {
    return supabase.from('branches').delete().eq('id', id);
  },
};
