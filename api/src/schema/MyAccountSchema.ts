/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
 *  Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte,
 *  é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 */

export class MyAccountSchema {
    static updateUser = {
        body: {
            type: "object",
            required: ["name", "username"],
            properties: {
                name: { type: "string", maxLength: 255 },
                username: { type: "string", maxLength: 255 },
            },
            additionalProperties: false,
        },
    };

    static updatePhone = {
        body: {
            type: "object",
            required: ["phone"],
            properties: {
                phone: { type: "string" },
            },
            additionalProperties: false,
        },
    };

    static updatePassword = {
        body: {
            type: "object",
            required: ["oldPassword", "newPassword", "confirmPassword"],
            properties: {
                oldPassword: { type: "string", minLength: 0 },
                newPassword: { type: "string", minLength: 6 },
                confirmPassword: { type: "string", minLength: 6 },
            },
            additionalProperties: false,
        },
    };
}
