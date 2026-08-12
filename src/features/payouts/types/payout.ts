export interface Payout {
  id: string;
  amount: number;
  destination: string | null;
  note: string | null;
  paidAt: string;
  createdAt: string;
}

export interface PayoutBalance {
  totalRevenue: number;
  totalWithdrawn: number;
  remaining: number;
}

export interface NewPayout {
  amount: number;
  destination?: string;
  note?: string;
  paidAt?: string;
}
