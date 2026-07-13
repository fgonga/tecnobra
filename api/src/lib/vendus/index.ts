/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  SDK interno Cegid Vendus (faturação eletrónica).
 *  https://www.vendus.co.ao/ws/
 *
 *  Uso (caminho relativo — o api não tem alias "@/"):
 *    import { vendus } from "../lib/vendus";             // instância default (config)
 *    const doc = await vendus.documents.create({ ... });
 *    await vendus.documents.cancel(doc.id, "engano");
 *
 *  Ou instância própria:
 *    const client = createVendusClient({ apiKey, registerId, mode });
 */

import { config } from "../../config/env";
import { VendusHttp } from "./VendusHttp";
import { DocumentsResource } from "./resources/documents";
import { ClientsResource } from "./resources/clients";
import { ProductsResource } from "./resources/products";
import { PaymentMethodsResource } from "./resources/payment-methods";
import { RegistersResource } from "./resources/registers";
import type { VendusMode } from "./types";

export interface VendusClientOptions {
  apiKey: string;
  baseUrl?: string;
  registerId?: number;
  mode?: VendusMode;
  timeoutMs?: number;
}

export class VendusClient {
  readonly http: VendusHttp;
  readonly documents: DocumentsResource;
  readonly clients: ClientsResource;
  readonly products: ProductsResource;
  readonly paymentMethods: PaymentMethodsResource;
  readonly registers: RegistersResource;

  constructor(opts: VendusClientOptions) {
    this.http = new VendusHttp({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
      timeoutMs: opts.timeoutMs,
    });
    this.documents = new DocumentsResource(this.http, {
      registerId: opts.registerId,
      mode: opts.mode ?? "tests",
    });
    this.clients = new ClientsResource(this.http);
    this.products = new ProductsResource(this.http);
    this.paymentMethods = new PaymentMethodsResource(this.http);
    this.registers = new RegistersResource(this.http);
  }
}

export function createVendusClient(opts: VendusClientOptions): VendusClient {
  return new VendusClient(opts);
}

/**
 * Instância default, configurada via env (config.vendus).
 * Lazy: só valida a chave no primeiro uso, para não rebentar o boot quando
 * a faturação ainda não está configurada.
 */
let _default: VendusClient | null = null;
function defaultClient(): VendusClient {
  if (!_default) {
    _default = new VendusClient({
      apiKey: config.vendus.apiKey,
      baseUrl: config.vendus.apiUrl,
      registerId: config.vendus.registerId || undefined,
      mode: config.vendus.mode,
    });
  }
  return _default;
}

export const vendus = {
  get documents() {
    return defaultClient().documents;
  },
  get clients() {
    return defaultClient().clients;
  },
  get products() {
    return defaultClient().products;
  },
  get paymentMethods() {
    return defaultClient().paymentMethods;
  },
  get registers() {
    return defaultClient().registers;
  },
  get http() {
    return defaultClient().http;
  },
};

export { VendusError } from "./VendusError";
export * from "./types";
