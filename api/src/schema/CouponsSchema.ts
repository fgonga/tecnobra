export class CouponsSchema {
  static store = {
    body: {
      type: "object",
      required: ["name", "code"],
      properties: {
        name: {
          type: "string",
          maxLength: 255,
          description: "Nome do cupão",
        },
        code: {
          type: "string",
          maxLength: 100,
          description: "Código único do cupão",
        },
        active: {
          type: "boolean",
          default: false,
          description: "Estado do cupão (ativo/inativo)",
        },
        amount: {
          type: "number",
          minimum: 0,
          multipleOf: 0.01,
          default: 0.0,
          description: "Valor fixo de desconto",
        },
        percentage: {
          type: "number",
          minimum: 0,
          maximum: 100,
          multipleOf: 0.01,
          default: 0.0,
          description: "Percentagem de desconto",
        },
        expire_at: {
          type: ["string", "null"],
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?$",
          description: "Data de expiração do cupão",
        },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        name:       { type: "string", maxLength: 255 },
        code:       { type: "string", maxLength: 100 },
        active:     { type: "boolean" },
        amount:     { type: "number", minimum: 0, multipleOf: 0.01 },
        percentage: { type: "number", minimum: 0, maximum: 100, multipleOf: 0.01 },
        expire_at:  {
          type: ["string", "null"],
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?$",
        },
      },
      additionalProperties: false,
    },
  };
}
