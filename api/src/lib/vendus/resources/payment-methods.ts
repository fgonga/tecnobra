/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Recurso "paymentmethods" do Vendus — métodos de pagamento da conta.
 *  Necessário para documentos pagos no ato (FR/RG), que exigem o array `payments`.
 *  É um sub-recurso de documents: /documents/paymentmethods/.
 *  https://www.vendus.co.ao/ws/v1.1/documents/paymentmethods.doc
 */

import type { VendusHttp } from "../VendusHttp";
import type { CreatePaymentMethodInput, VendusPaymentMethod } from "../types";

export class PaymentMethodsResource {
  constructor(private readonly http: VendusHttp) {}

  /** Lista os métodos de pagamento configurados na conta. */
  list(): Promise<VendusPaymentMethod[]> {
    return this.http.get<VendusPaymentMethod[]>("/documents/paymentmethods/");
  }

  /** Cria um método de pagamento na conta. Requer title e type. */
  create(input: CreatePaymentMethodInput): Promise<VendusPaymentMethod> {
    return this.http.post<VendusPaymentMethod>("/documents/paymentmethods/", input);
  }

  /** Devolve um método de pagamento utilizável por defeito (primeiro ativo). */
  async getDefault(): Promise<VendusPaymentMethod | null> {
    const rows = await this.list();
    if (!Array.isArray(rows) || !rows.length) return null;
    return rows.find((m) => m.status === "on") ?? rows[0];
  }
}
