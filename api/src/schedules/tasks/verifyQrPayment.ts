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
import { AsyncTask } from "toad-scheduler";
import {OrdersService} from "../../services/OrdersService";
import {OrderModel} from "../../models/order.model";

export async function verifyQrPayment() {

    // Get pagamentos que ja passou 24 ou seja espirou sou os com paymentType qr mas não esta cancelado

    // Para cada expirando verifica se ja foi paga so para não cancelar um que foi pago

    // Os restantes verifica se já foram pagos
    return null;
}
export default new AsyncTask(
    "verifyQrPayment",
    verifyQrPayment
);
