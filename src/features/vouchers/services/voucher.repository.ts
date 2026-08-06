import { supabase } from '@/lib/supabase';
import type { GenerateVouchersInput } from '../types/voucher';

export const voucherRepository = {
  generate(input: GenerateVouchersInput) {
    return supabase.rpc('generate_vouchers', {
      p_package_id: input.packageId,
      p_count: input.count,
      p_length: input.length,
      p_prefix: input.prefix ?? null,
      p_notes: input.notes ?? null,
      p_branch_id: input.branchId ?? null,
      p_valid_days: input.validDays ?? null,
    });
  },

  listBatches(companyId: string) {
    return supabase
      .from('voucher_batches')
      .select('*, package:package_id(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  listVouchers(companyId: string, batchId?: string, status?: string) {
    let q = supabase
      .from('vouchers')
      .select('*, package:package_id(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (batchId) q = q.eq('batch_id', batchId);
    if (status) q = q.eq('status', status);
    return q;
  },

  setStatus(id: string, status: string) {
    return supabase.from('vouchers').update({ status }).eq('id', id);
  },

  /** Codes only, for pushing a batch to the router as hotspot users. */
  listVouchersByBatch(batchId: string) {
    return supabase.from('vouchers').select('code').eq('batch_id', batchId).limit(5000);
  },

  removeBatch(id: string) {
    return supabase.from('voucher_batches').delete().eq('id', id);
  },
};
