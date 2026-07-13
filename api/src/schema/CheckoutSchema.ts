export class CheckoutSchema {
  static checkout = {
    body: {
      type: "object",
      required: ["students", "quantity", "paymentType", 'courseId'],
      properties: {
        students: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "email", "phone"],
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              phone: { type: "string" },
            },
            additionalProperties: false,
          },
          minItems: 1,
        },
        quantity: { type: "number", minimum: 1 },
        paymentType: { type: "string" },
        phone: { type: "string" },
        orderCode: { type: "string" },
        paymentCode: { type: "string" },
        courseId: { type: "number" },
        couponId: { type: "number" },
        cardId: { type: "number" },
      },
      additionalProperties: false,
    },
  };
}

