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
export interface AppyPayResult {
    message: string;
    retryable: boolean;
}

export default function AppyPayWebHookMessage(response): AppyPayResult {

    const { successful, code, message } = response.responseStatus;

    // Só o código 100 é pagamento efetivamente confirmado/pago.
    if (successful && code === 100) {
        return {
            message: "Pagamento confirmado com sucesso. Obrigado pela sua preferência!",
            retryable: false,
        };
    }
    // 101 = referência criada/aceite (aguarda pagamento do cliente);
    // 102 = a aguardar autorização. NÃO são confirmação de pagamento — não
    // devem mostrar "confirmado com sucesso".
    if (code === 101) {
        return {
            message: message || "Referência gerada. Conclua o pagamento para confirmar.",
            retryable: false,
        };
    }
    if (code === 102) {
        return {
            message: message || "A aguardar autorização do pagamento.",
            retryable: true,
        };
    }
    switch (code) {
        case 200:
            // Telefone não ativo/registado no MCX Express — erro permanente, retry não resolve
            return {
                message: "O número de telemóvel não está ativo no Multicaixa Express. Contacte o suporte do Multicaixa Express para ativar o seu número.",
                retryable: false,
            };
        case 211:
            // Prazo de autorização expirou — transitório, vale a pena tentar de novo
            return {
                message: "O prazo de pagamento expirou.",
                retryable: true,
            };
        case 231:
            // Pagamento recusado pelo utilizador — decisão deliberada, retry automático não aplica
            return {
                message: "Pagamento não autorizado. O pagamento foi recusado.",
                retryable: false,
            };
        default:
            return {
                message: message || "Falha no pagamento. Tente novamente.",
                retryable: true,
            };
    }
}
