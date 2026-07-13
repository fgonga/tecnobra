export class MetricasDesempenhoSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome", "unidade"],
      properties: {
        nome:      { type: "string", minLength: 2, maxLength: 100 },
        unidade:   { type: "string", minLength: 1, maxLength: 20 },
        descricao: { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        nome:      { type: "string", minLength: 2, maxLength: 100 },
        unidade:   { type: "string", minLength: 1, maxLength: 20 },
        descricao: { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}

export class DesempenhosSchema {
  static store = {
    body: {
      type: "object",
      required: ["obra_id", "trabalhador_id", "metrica_id", "data", "quantidade"],
      properties: {
        obra_id:        { type: "integer", minimum: 1 },
        trabalhador_id: { type: "integer", minimum: 1 },
        metrica_id:     { type: "integer", minimum: 1 },
        data:           { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        quantidade:     { type: "number", exclusiveMinimum: 0 },
        obs:            { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        data:       { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        quantidade: { type: "number", exclusiveMinimum: 0 },
        obs:        { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}
