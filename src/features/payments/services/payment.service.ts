import { supabase } from '@/lib/supabase';
import type { PaymentTransaction, PaymentStatus, PaymentSummary } from '../types/payment';

interface Row {
  id: string;
  snippe_reference: string | null;
  amount: number;
  phone_number: string;
  status: PaymentStatus;
  voucher_code: string | null;
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
  package: { name: string } | { name: string }[] | null;
}

function pkgName(p: Row['package']): string | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0]?.name ?? null) : p.name;
}

function mapRow(r: Row): PaymentTransaction {
  return {
    id: r.id,
    reference: r.snippe_reference,
    amount: Number(r.amount),
    phoneNumber: r.phone_number,
    status: r.status,
    voucherCode: r.voucher_code,
    packageName: pkgName(r.package),
    failureReason: r.failure_reason,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

export const paymentService = {
  async list(status?: PaymentStatus, search?: string): Promise<PaymentTransaction[]> {
    let q = supabase
      .from('payment_transactions')
      .select('id, snippe_reference, amount, phone_number, status, voucher_code, failure_reason, created_at, completed_at, package:packages(name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status) q = q.eq('status', status);
    if (search && search.trim()) {
      const s = search.trim();
      q = q.or(`phone_number.ilike.%${s}%,voucher_code.ilike.%${s}%,snippe_reference.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Row[]).map(mapRow);
  },

  async summary(): Promise<PaymentSummary> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('status, amount')
      .limit(1000);
    if (error) throw error;
    const rows = (data ?? []) as { status: PaymentStatus; amount: number }[];
    return {
      total: rows.length,
      completed: rows.filter((r) => r.status === 'completed').length,
      pending: rows.filter((r) => r.status === 'pending').length,
      failed: rows.filter((r) => ['failed', 'voided', 'expired'].includes(r.status)).length,
      revenue: rows.filter((r) => r.status === 'completed').reduce((s, r) => s + Number(r.amount), 0),
    };
  },
};
