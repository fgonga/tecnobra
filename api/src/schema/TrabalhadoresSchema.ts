export class TrabalhadoresSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome", "obra_id", "empresa_id"],
      properties: {
        obra_id:    { type: "integer", minimum: 1 },
        empresa_id: { type: "integer", minimum: 1 },
        nome:       { type: "string", minLength: 2, maxLength: 150 },
        funcao:     { type: ["string", "null"], maxLength: 100 },
        telefone:   { type: ["string", "null"], maxLength: 20 },
        email:      { type: ["string", "null"], maxLength: 255 },
        documento:  { type: ["string", "null"], maxLength: 50 },
        // Foto em data-URL base64 (guardada em /uploads/fotos) ou caminho já gravado
        foto:       { type: ["string", "null"] },
        estado:     { type: "string", enum: ["ativo", "suspenso", "inativo"], default: "ativo" },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        obra_id:    { type: "integer", minimum: 1 },
        empresa_id: { type: "integer", minimum: 1 },
        nome:       { type: "string", minLength: 2, maxLength: 150 },
        funcao:     { type: ["string", "null"], maxLength: 100 },
        telefone:   { type: ["string", "null"], maxLength: 20 },
        email:      { type: ["string", "null"], maxLength: 255 },
        documento:  { type: ["string", "null"], maxLength: 50 },
        foto:       { type: ["string", "null"] },
        estado:     { type: "string", enum: ["ativo", "suspenso", "inativo"] },
      },
      additionalProperties: false,
    },
  };
}
