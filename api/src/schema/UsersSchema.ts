export class UsersSchema {
  static store = {
    body: {
      type: "object",
      required: ["name", "username", "phone", "status"],
      properties: {
        name: { type: "string", minLength: 2 },
        username: { type: "string", minLength: 3 },
        phone: { type: "string", minLength: 6 },
        status: { type: "boolean" },
        role: {
          type: "string",
          enum: ["superadmin", "admin", "user", "account","helper"],
          default: "user",
        },
      },
      additionalProperties: false,
    },
  };
}
