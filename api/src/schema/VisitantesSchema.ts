export class VisitantesSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome", "obra_id"],
      properties: {
        obra_id:       { type: "integer", minimum: 1 },
        nome:          { type: "string", minLength: 2, maxLength: 150 },
        empresa:       { type: ["string", "null"], maxLength: 150 },
        motivo:        { type: ["string", "null"], maxLength: 255 },
        telefone:      { type: ["string", "null"], maxLength: 20 },
        email:         { type: ["string", "null"], maxLength: 255 },
        documento:     { type: ["string", "null"], maxLength: 50 },
        anfitriao:     { type: ["string", "null"], maxLength: 150 },
        valido_de:     { type: ["string", "null"] },
        valido_ate:    { type: ["string", "null"] },
        estado:        { type: "string", enum: ["previsto", "ativo", "encerrado"], default: "previsto" },
        enviar_cartao: { type: "boolean", default: true },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        obra_id:    { type: "integer", minimum: 1 },
        nome:       { type: "string", minLength: 2, maxLength: 150 },
        empresa:    { type: ["string", "null"], maxLength: 150 },
        motivo:     { type: ["string", "null"], maxLength: 255 },
        telefone:   { type: ["string", "null"], maxLength: 20 },
        email:      { type: ["string", "null"], maxLength: 255 },
        documento:  { type: ["string", "null"], maxLength: 50 },
        anfitriao:  { type: ["string", "null"], maxLength: 150 },
        valido_de:  { type: ["string", "null"] },
        valido_ate: { type: ["string", "null"] },
        estado:     { type: "string", enum: ["previsto", "ativo", "encerrado"] },
      },
      additionalProperties: false,
    },
  };
}

export class VeiculosSchema {
  static store = {
    body: {
      type: "object",
      required: ["matricula", "obra_id"],
      properties: {
        obra_id:           { type: "integer", minimum: 1 },
        matricula:         { type: "string", minLength: 2, maxLength: 20 },
        foto:              { type: ["string", "null"] },
        marca_modelo:      { type: ["string", "null"], maxLength: 100 },
        tipo:              { type: "string", enum: ["ligeiro", "pesado", "maquina", "outro"], default: "ligeiro" },
        proprietario_tipo: { type: "string", enum: ["empresa", "trabalhador", "visitante", "outro"], default: "outro" },
        proprietario_nome: { type: ["string", "null"], maxLength: 150 },
        ocr_matricula:     { type: ["string", "null"], maxLength: 20 },
        ocr_confianca:     { type: ["number", "null"], minimum: 0, maximum: 1 },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        obra_id:           { type: "integer", minimum: 1 },
        matricula:         { type: "string", minLength: 2, maxLength: 20 },
        foto:              { type: ["string", "null"] },
        marca_modelo:      { type: ["string", "null"], maxLength: 100 },
        tipo:              { type: "string", enum: ["ligeiro", "pesado", "maquina", "outro"] },
        proprietario_tipo: { type: "string", enum: ["empresa", "trabalhador", "visitante", "outro"] },
        proprietario_nome: { type: ["string", "null"], maxLength: 150 },
      },
      additionalProperties: false,
    },
  };

  static ocr = {
    body: {
      type: "object",
      required: ["foto"],
      properties: {
        foto: { type: "string", minLength: 30 },
      },
      additionalProperties: false,
    },
  };
}
