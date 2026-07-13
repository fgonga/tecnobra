
import {BaseModel} from "./base.model";
export interface Config {
  id: number;
  promotion_active: boolean;
  promotion_quantity: number;
  promotion_quantity_max: number;
  default_course_id: number | null;
  platform_fee_rate: number;
  events_dispatch_interval: number;
  settlement_day_1: number;
  settlement_day_2: number;
  default_min_payout_kz: number;
  auto_settlements_enabled: boolean;
  default_payment_method: string;
  express_enabled: boolean;
  ref_enabled: boolean;
  qr_enabled: boolean;
  reference_expiration_minutes: number;
  reference_entity: string;
  message_cost: number;
  // Faturação (Vendus)
  invoice_default_type: string;        // FR, FT, ...
  invoice_mode: "tests" | "normal";
  invoice_tax_id: string;              // NOR, ISE, ...
  invoice_tax_exemption: string | null;
  invoice_auto_send_email: boolean;
}
export class ConfigModel  extends  BaseModel{
    static tableName = "parametrization";
}
