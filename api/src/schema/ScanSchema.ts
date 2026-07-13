export class ScanSchema {
  static resolve = {
    body: {
      type: "object",
      required: ["token"],
      properties: {
        token: { type: "string", minLength: 5, maxLength: 255 },
      },
      additionalProperties: false,
    },
  };

  static checkin = {
    body: {
      type: "object",
      properties: {
        token:         { type: "string", minLength: 5, maxLength: 255 },
        tipo_entidade: { type: "string", enum: ["trabalhador", "visitante", "veiculo"] },
        entidade_id:   { type: "integer", minimum: 1 },
        direcao:       { type: "string", enum: ["entrada", "saida"] },
        metodo:        { type: "string", enum: ["qr", "manual", "ocr"] },
        portao:        { type: ["string", "null"], maxLength: 50 },
        obs:           { type: ["string", "null"], maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}
