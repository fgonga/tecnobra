/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Recurso "clients" do Vendus — CRUD de clientes.
 *  https://www.vendus.co.ao/ws/v1.1/clients.doc
 */

import type { VendusHttp } from "../VendusHttp";
import type {
  CreateClientInput,
  ListClientsParams,
  UpdateClientInput,
  VendusClientRecord,
} from "../types";

export class ClientsResource {
  constructor(private readonly http: VendusHttp) {}

  /** Cria um cliente. Requer fiscal_id, name e country. */
  create(input: CreateClientInput): Promise<VendusClientRecord> {
    return this.http.post<VendusClientRecord>("/clients/", input);
  }

  /** Consulta um cliente por id. */
  get(id: number, params?: { include_balance?: "yes" | "no" }): Promise<VendusClientRecord> {
    return this.http.get<VendusClientRecord>(`/clients/${id}/`, { ...params });
  }

  /** Lista/filtra clientes. */
  list(params?: ListClientsParams): Promise<VendusClientRecord[]> {
    return this.http.get<VendusClientRecord[]>("/clients/", { ...params });
  }

  /** Atualização parcial. */
  update(id: number, input: UpdateClientInput): Promise<VendusClientRecord> {
    return this.http.patch<VendusClientRecord>(`/clients/${id}/`, input);
  }

  /** Desativa o cliente (status "inactive") — alternativa segura ao delete. */
  deactivate(id: number): Promise<VendusClientRecord> {
    return this.update(id, { status: "inactive" });
  }

  /**
   * Apaga o cliente. A API pode não permitir remoção definitiva de clientes
   * com documentos associados — nesses casos prefira deactivate().
   */
  remove(id: number): Promise<unknown> {
    return this.http.del(`/clients/${id}/`);
  }

  /** Procura o primeiro cliente por NIF (helper para evitar duplicados). */
  async findByFiscalId(fiscalId: string): Promise<VendusClientRecord | null> {
    const rows = await this.list({ fiscal_id: fiscalId });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }
}
