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
export class CommonSchema {
    static paginationRequest = {
        querystring: {
            type: "object",
            properties: {
                search: { type: "string", nullable: true },
                total: { type: "integer", nullable: true },
                perPage: { type: "integer", default: 10 },
                page: { type: "integer", default: 1 },
                columns: {
                    type: "array",
                    items: { type: "string" },
                    default: ["*"],
                },
                with: {
                    type: "array",
                    items: { type: "string" },
                    default: [],
                },
                filters: {
                    type: "array",
                    default: [],
                },
                orderBy: { type: "string", default: "id" },
                sortMethod: {
                    type: "string",
                    enum: ["ASC", "DESC"],
                    default: "DESC",
                },
                searchable: {
                    type: "array",
                    items: { type: "string" },
                    default: [],
                },
            },
            additionalProperties: false,
        },
    }
    static customShow = {
        params: {
            type: "object",
            required: ["id"],
            properties: {
                id: { type: "integer", minimum: 1 },
            },
        },
        querystring: {
            type: "object",
            properties: {
                columns: {
                    type: "array",
                    items: { type: "string" },
                    default: ["*"],
                },
                with: {
                    type: "array",
                    items: { type: "string" },
                    default: [],
                },
            },
            additionalProperties: false,
        },
    };
}
