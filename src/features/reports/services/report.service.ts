import { supabase } from '@/lib/supabase';
import type { VoucherReport, BranchReport } from '../types/report';

interface ReportRow {
  sales_today_count: number;
  sales_today_revenue: number;
  sales_week_count: number;
  sales_week_revenue: number;
  sales_month_count: number;
  sales_month_revenue: number;
  total_vouchers: number;
  used_vouchers: number;
  unused_vouchers: number;
  total_revenue: number;
}

interface BranchRow {
  branch_id: string;
  branch_name: string;
  voucher_count: number;
  used_count: number;
  revenue: number;
}

export const reportService = {
  async getVoucherReport(branchId?: string | null): Promise<VoucherReport> {
    const { data, error } = await supabase.rpc('get_voucher_reports', {
      p_branch_id: branchId ?? null,
    });
    if (error) throw error;
    const r = (data ?? [])[0] as ReportRow | undefined;
    return {
      salesTodayCount: Number(r?.sales_today_count ?? 0),
      salesTodayRevenue: Number(r?.sales_today_revenue ?? 0),
      salesWeekCount: Number(r?.sales_week_count ?? 0),
      salesWeekRevenue: Number(r?.sales_week_revenue ?? 0),
      salesMonthCount: Number(r?.sales_month_count ?? 0),
      salesMonthRevenue: Number(r?.sales_month_revenue ?? 0),
      totalVouchers: Number(r?.total_vouchers ?? 0),
      usedVouchers: Number(r?.used_vouchers ?? 0),
      unusedVouchers: Number(r?.unused_vouchers ?? 0),
      totalRevenue: Number(r?.total_revenue ?? 0),
    };
  },

  async getBranchReports(): Promise<BranchReport[]> {
    const { data, error } = await supabase.rpc('get_branch_reports');
    if (error) throw error;
    return ((data ?? []) as BranchRow[]).map((b) => ({
      branchId: b.branch_id,
      branchName: b.branch_name,
      voucherCount: Number(b.voucher_count ?? 0),
      usedCount: Number(b.used_count ?? 0),
      revenue: Number(b.revenue ?? 0),
    }));
  },
};
