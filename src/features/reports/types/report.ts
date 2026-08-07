export interface VoucherReport {
  salesTodayCount: number;
  salesTodayRevenue: number;
  salesWeekCount: number;
  salesWeekRevenue: number;
  salesMonthCount: number;
  salesMonthRevenue: number;
  totalVouchers: number;
  usedVouchers: number;
  unusedVouchers: number;
  totalRevenue: number;
}

export interface BranchReport {
  branchId: string;
  branchName: string;
  voucherCount: number;
  usedCount: number;
  revenue: number;
}
