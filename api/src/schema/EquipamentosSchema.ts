export class EquipamentosSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome", "obra_id"],
      properties: {
        obra_id:      { type: "integer", minimum: 1 },
        nome:         { type: "string", minLength: 2, maxLength: 150 },
        codigo:       { type: ["string", "null"], maxLength: 50 },
        categoria:    { type: "string", enum: ["equipamento", "ferramenta"], default: "ferramenta" },
        numero_serie: { type: ["string", "null"], maxLength: 100 },
        estado:       { type: "string", enum: ["disponivel", "danificado", "fora_servico"], default: "disponivel" },
        foto:         { type: ["string", "null"] },
        obs:          { type: ["string", "null"], maxLength: 255 },
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
        codigo:       { type: ["string", "null"], maxLength: 50 },
        categoria:    { type: "string", enum: ["equipamento", "ferramenta"] },
        numero_serie: { type: ["string", "null"], maxLength: 100 },
        // em_uso/desaparecido só via levantar/devolver
        estado:       { type: "string", enum: ["disponivel", "danificado", "fora_servico"] },
        foto:         { type: ["string", "null"] },
        obs:          { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };

  static levantar = {
    body: {
      type: "object",
      required: ["trabalhador_id"],
      properties: {
        trabalhador_id:     { type: "integer", minimum: 1 },
        devolucao_prevista: { type: ["string", "null"] },
        obs:                { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };

  static devolver = {
    body: {
      type: "object",
      properties: {
        estado_devolucao: { type: "string", enum: ["ok", "danificado", "desaparecido"], default: "ok" },
        obs:              { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}
