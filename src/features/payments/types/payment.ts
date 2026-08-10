export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'voided' | 'expired';

export interface PaymentTransaction {
  id: string;
  reference: string | null;
  amount: number;
  phoneNumber: string;
  status: PaymentStatus;
  voucherCode: string | null;
  packageName: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PaymentSummary {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  revenue: number;
}
