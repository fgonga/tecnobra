export class ObrasSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome", "codigo"],
      properties: {
        nome:                { type: "string", minLength: 2, maxLength: 150 },
        codigo:              { type: "string", minLength: 2, maxLength: 30 },
        endereco:            { type: ["string", "null"], maxLength: 255 },
        cliente:             { type: ["string", "null"], maxLength: 150 },
        estado:              { type: "string", enum: ["ativa", "pausada", "concluida"], default: "ativa" },
        data_inicio:         { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        data_fim_prevista:   { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        responsavel_user_id: { type: ["integer", "null"] },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        nome:                { type: "string", minLength: 2, maxLength: 150 },
        codigo:              { type: "string", minLength: 2, maxLength: 30 },
        endereco:            { type: ["string", "null"], maxLength: 255 },
        cliente:             { type: ["string", "null"], maxLength: 150 },
        estado:              { type: "string", enum: ["ativa", "pausada", "concluida"] },
        data_inicio:         { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        data_fim_prevista:   { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        responsavel_user_id: { type: ["integer", "null"] },
      },
      additionalProperties: false,
    },
  };
}
