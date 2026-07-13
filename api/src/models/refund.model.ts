import { BaseModel } from "./base.model";

export interface Refund {
  id?: number;
  order_id: number;
  payment_id?: number | null;
  amount: number;
  reason?: string;
  status?: "pending" | "approved" | "rejected";
  notes?: string | null;
  processed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class RefundModel extends BaseModel {
  static tableName = "refunds";
  static allowedColumns = ["id","order_id","payment_id","amount","reason","status","notes","processed_at","requested_by","approved_by","created_at","updated_at"];
  static allowedRelations = ["order","payment"];

  static async create(data: Partial<Refund> & { requested_by?: string }): Promise<any> {
    return await this.genericCreate({
      order_id: data.order_id,
      payment_id: data.payment_id ?? null,
      amount: data.amount,
      reason: data.reason ?? null,
      status: "pending",
      notes: data.notes ?? null,
      requested_by: data.requested_by ?? null,
    });
  }

  static async approve(id: number, notes?: string, approvedBy?: string): Promise<boolean> {
    return await this.update(id, {
      status: "approved",
      notes: notes ?? null,
      approved_by: approvedBy ?? null,
      processed_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  }

  static async reject(id: number, notes?: string): Promise<boolean> {
    return await this.update(id, {
      status: "rejected",
      notes: notes ?? null,
      processed_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  }

  static async order(refund: any, connection?: any) {
    if (!refund.order_id) return null;
    const { OrderModel } = await import("./order.model");
    return await OrderModel.findOneById({ id: refund.order_id }, connection);
  }

  static async payment(refund: any, connection?: any) {
    if (!refund.payment_id) return null;
    const { PaymentModel } = await import("./payment.model");
    return await PaymentModel.findOneById({ id: refund.payment_id }, connection);
  }
}
