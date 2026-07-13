import {CouponModel, ICoupon} from "../models/coupon.model";
import {BaseCrudService} from "./BaseCrudService";
import {normalizeDatetimeLocal} from "../utils/date";
export class CouponsService extends BaseCrudService<typeof CouponModel> {
  constructor() {
    super( CouponModel)
  }
  async store(data: ICoupon): Promise<any> {
    data.expire_at = normalizeDatetimeLocal(data.expire_at);
    return super.store(data);
  }
  async update(id: number, data: ICoupon): Promise<boolean> {
    data.expire_at = normalizeDatetimeLocal(data.expire_at);
    return super.update(id, data);
  }
}
