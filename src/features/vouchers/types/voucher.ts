export type VoucherStatus = 'unused' | 'used' | 'expired' | 'disabled';

export interface VoucherBatch {
  id: string;
  companyId: string;
  branchId: string | null;
  packageId: string | null;
  packageName: string | null;
  count: number;
  prefix: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Voucher {
  id: string;
  batchId: string | null;
  packageId: string | null;
  packageName: string | null;
  code: string;
  status: VoucherStatus;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface GenerateVouchersInput {
  packageId: string;
  count: number;
  length: number;
  prefix?: string | null;
  notes?: string | null;
  branchId?: string | null;
  validDays?: number | null;
}
