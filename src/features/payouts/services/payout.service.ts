import { supabase } from '@/lib/supabase';
import type { Payout, PayoutBalance, NewPayout } from '../types/payout';

interface Row {
  id: string;
  amount: number;
  destination: string | null;
  note: string | null;
  paid_at: string;
  created_at: string;
}

export const payoutService = {
  async list(): Promise<Payout[]> {
    const { data, error } = await supabase
      .from('payouts')
      .select('id, amount, destination, note, paid_at, created_at')
      .order('paid_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data ?? []) as Row[]).map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      destination: r.destination,
      note: r.note,
      paidAt: r.paid_at,
      createdAt: r.created_at,
    }));
  },

  async balance(): Promise<PayoutBalance> {
    const { data, error } = await supabase.rpc('payout_balance');
    if (error) throw error;
    const r = (data ?? [])[0] as { total_revenue: number; total_withdrawn: number; remaining: number } | undefined;
    return {
      totalRevenue: Number(r?.total_revenue ?? 0),
      totalWithdrawn: Number(r?.total_withdrawn ?? 0),
      remaining: Number(r?.remaining ?? 0),
    };
  },

  async create(input: NewPayout, companyId: string): Promise<void> {
    const { error } = await supabase.from('payouts').insert({
      company_id: companyId,
      amount: input.amount,
      destination: input.destination || null,
      note: input.note || null,
      paid_at: input.paidAt || new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('payouts').delete().eq('id', id);
    if (error) throw error;
  },
};
