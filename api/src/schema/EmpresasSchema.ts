export class EmpresasSchema {
  static store = {
    body: {
      type: "object",
      required: ["nome"],
      properties: {
        nome:          { type: "string", minLength: 2, maxLength: 150 },
        nif:           { type: ["string", "null"], maxLength: 30 },
        tipo:          { type: "string", enum: ["empreiteiro", "subempreiteiro", "fornecedor", "fiscalizacao", "outro"], default: "subempreiteiro" },
        contacto_nome: { type: ["string", "null"], maxLength: 150 },
        telefone:      { type: ["string", "null"], maxLength: 20 },
        email:         { type: ["string", "null"], maxLength: 255 },
        estado:        { type: "string", enum: ["ativa", "inativa"], default: "ativa" },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        nome:          { type: "string", minLength: 2, maxLength: 150 },
        nif:           { type: ["string", "null"], maxLength: 30 },
        tipo:          { type: "string", enum: ["empreiteiro", "subempreiteiro", "fornecedor", "fiscalizacao", "outro"] },
        contacto_nome: { type: ["string", "null"], maxLength: 150 },
        telefone:      { type: ["string", "null"], maxLength: 20 },
        email:         { type: ["string", "null"], maxLength: 255 },
        estado:        { type: "string", enum: ["ativa", "inativa"] },
      },
      additionalProperties: false,
    },
  };
}
