/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Erro tipado das respostas da API Vendus.
 */

export interface VendusApiError {
  code?: string;
  message?: string;
  field?: string;
}

export class VendusError extends Error {
  /** Código HTTP da resposta. */
  readonly status: number;
  /** Lista de erros devolvida pela API (quando existe). */
  readonly errors: VendusApiError[];
  /** Corpo cru da resposta, para diagnóstico. */
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "VendusError";
    this.status = status;
    this.body = body;
    this.errors = Array.isArray((body as any)?.errors) ? (body as any).errors : [];
  }

  /** true para 401/403 — chave inválida ou sem permissão. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** true para 429 — limite de créditos excedido. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
