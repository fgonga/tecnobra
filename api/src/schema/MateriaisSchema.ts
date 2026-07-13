export class MateriaisSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome", "obra_id", "unidade"],
      properties: {
        obra_id:      { type: "integer", minimum: 1 },
        nome:         { type: "string", minLength: 2, maxLength: 150 },
        unidade:      { type: "string", minLength: 1, maxLength: 20 },
        categoria:    { type: ["string", "null"], maxLength: 50 },
        stock_atual:  { type: "number", minimum: 0, default: 0 },
        stock_minimo: { type: "number", minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        obra_id:      { type: "integer", minimum: 1 },
        nome:         { type: "string", minLength: 2, maxLength: 150 },
        unidade:      { type: "string", minLength: 1, maxLength: 20 },
        categoria:    { type: ["string", "null"], maxLength: 50 },
        // stock_atual só muda via guias/consumos
        stock_minimo: { type: "number", minimum: 0 },
      },
      additionalProperties: false,
    },
  };
}

export class OrcamentosSchema {
  static store = {
    body: {
      type: "object",
      required: ["obra_id", "material_id", "quantidade_orcada"],
      properties: {
        obra_id:           { type: "integer", minimum: 1 },
        material_id:       { type: "integer", minimum: 1 },
        quantidade_orcada: { type: "number", minimum: 0 },
        obs:               { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        quantidade_orcada: { type: "number", minimum: 0 },
        obs:               { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}

export class GuiasSchema {
  static store = {
    body: {
      type: "object",
      required: ["obra_id", "numero", "data_entrega", "itens"],
      properties: {
        obra_id:               { type: "integer", minimum: 1 },
        numero:                { type: "string", minLength: 1, maxLength: 50 },
        fornecedor_empresa_id: { type: ["integer", "null"] },
        fornecedor_nome:       { type: ["string", "null"], maxLength: 150 },
        data_entrega:          { type: "string" },
        documento:             { type: ["string", "null"] },
        obs:                   { type: ["string", "null"], maxLength: 255 },
        itens: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["material_id", "quantidade"],
            properties: {
              material_id:    { type: "integer", minimum: 1 },
              quantidade:     { type: "number", exclusiveMinimum: 0 },
              preco_unitario: { type: ["number", "null"], minimum: 0 },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  };
}

export class ConsumosSchema {
  static store = {
    body: {
      type: "object",
      required: ["obra_id", "material_id", "quantidade"],
      properties: {
        obra_id:        { type: "integer", minimum: 1 },
        material_id:    { type: "integer", minimum: 1 },
        quantidade:     { type: "number", exclusiveMinimum: 0 },
        trabalhador_id: { type: ["integer", "null"] },
        obs:            { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}
