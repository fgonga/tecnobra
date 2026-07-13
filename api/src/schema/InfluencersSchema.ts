export class InfluencersSchema {
  static store = {
    body: {
      type: "object",
      required: ["name", "coupon_id", "commission"],
      properties: {
        name: { type: "string", minLength: 2 },
        phone: { type: "string", minLength: 6 },
        email: { type: "string", minLength: 6, format: "email" },
        status: { type: ["boolean", "integer"], default: true },
        coupon_id: { type: "integer", minimum: 1 },
        commission: { type: "number", minimum: 0, maximum: 100 },
        bank_name: { type: ["string", "null"] },
        bank_account_name: { type: ["string", "null"] },
        bank_account_number: { type: ["string", "null"] },
        min_payout_kz: { type: ["number", "null"], minimum: 0 }
      },
      additionalProperties: false
    }
  };

  static update = {
    body: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2 },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        status: { type: ["boolean", "integer"] },
        coupon_id: { type: "integer", minimum: 1 },
        commission: { type: "number", minimum: 0, maximum: 100 },
        bank_name: { type: ["string", "null"] },
        bank_account_name: { type: ["string", "null"] },
        bank_account_number: { type: ["string", "null"] },
        min_payout_kz: { type: ["number", "null"], minimum: 0 }
      },
      additionalProperties: false
    }
  };
}
