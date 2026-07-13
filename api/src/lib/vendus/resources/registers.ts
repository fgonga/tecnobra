/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Recurso "registers" do Vendus — caixas/POS da conta.
 *  Útil para descobrir o VENDUS_REGISTER_ID (a caixa do tipo "api").
 *  https://www.vendus.co.ao/ws/v1.1/registers.doc
 */

import type { VendusHttp } from "../VendusHttp";
import type { VendusRegister } from "../types";

export class RegistersResource {
  constructor(private readonly http: VendusHttp) {}

  /** Lista as caixas/POS da conta. */
  list(params?: { store_id?: number; type?: string }): Promise<VendusRegister[]> {
    return this.http.get<VendusRegister[]>("/registers/", { ...params });
  }

  /** Consulta uma caixa por id. */
  get(id: number): Promise<VendusRegister> {
    return this.http.get<VendusRegister>(`/registers/${id}/`);
  }

  /** Devolve a caixa do tipo "api" (a usar em VENDUS_REGISTER_ID), ou null. */
  async apiRegister(): Promise<VendusRegister | null> {
    const rows = await this.list();
    if (!Array.isArray(rows) || !rows.length) return null;
    return rows.find((r) => r.type === "api") ?? null;
  }
}
