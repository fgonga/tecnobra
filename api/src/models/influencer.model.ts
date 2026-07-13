import {BaseModel} from "./base.model";
import {CouponModel} from "./coupon.model";
export interface Influencer {
  id?: number;
  name: string;
  phone: string;
  email: string;
  status: number;
  commission: number;
  min_payout_kz?: number | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
}
export class InfluencerModel  extends  BaseModel{
  static tableName = "influencers";
  static allowedColumns = ["id","name","phone","email","status","commission","coupon_id","min_payout_kz","bank_name","bank_account_name","bank_account_number","created_at","updated_at"];
  static allowedRelations = ["coupon"];
  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }
  static async coupon(influencer: any, connection?: any) {
    if (!influencer.coupon_id) return null;
    return await CouponModel.findOneBy("id", influencer.coupon_id, connection);
  }
}
