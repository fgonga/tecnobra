/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

export class AuthSchema {
  static login = {
    body: {
      type: "object",
      required: ["identification", "password"],
      properties: {
        identification: { type: "string"},
        password: { type: "string"},
      },
      additionalProperties: false,
    },
  };
  static checkPhone = {
    body: {
      type: "object",
      required: ["phone"],
      properties: {
        phone: { type: "string", minLength: 6, maxLength: 20 },
      },
      additionalProperties: false,
    },
  };
  static verifyCode = {
    body: {
      type: "object",
      required: ["phone", "code"],
      properties: {
        phone: { type: "string", minLength: 6, maxLength: 20 },
        code: { type: "string", minLength: 5, maxLength: 5 },
      },
      additionalProperties: false,
    },
  };
  static resetPassword = {
    body: {
      type: "object",
      required: ["phone", "password"],
      properties: {
        phone: { type: "string", minLength: 6, maxLength: 20 },
        password: { type: "string", minLength: 8, maxLength: 255 },
      },
      additionalProperties: false,
    },
  };
}
