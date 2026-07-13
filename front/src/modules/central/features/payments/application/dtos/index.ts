export interface IPayment {
  id: number;
  code: string;
  order_id: number;
  coupon_id?: number | null;
  phone: string;
  reference?: string | null;
  payment_type?: 'express' | 'aexpress' | 'qr' | 'ref' | 'aref' | string;

  amount: number | string;
  status: 'pending' | 'paid' | 'failed';
  is_paid: boolean | 0 | 1;

  pending_at?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  expired_at?: string | null;

  response?: Record<string, any> | null;
}
