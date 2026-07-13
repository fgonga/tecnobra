export class OrdersSchema{
  static store = {
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 100 },
      },
      additionalProperties: false,
    },
  };
}
