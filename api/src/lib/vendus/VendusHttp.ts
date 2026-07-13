/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Camada HTTP do SDK Vendus — autenticação, querystring, parsing e erros.
 *  Usa fetch nativo (Bun). Sem dependências externas.
 */

import { VendusError } from "./VendusError";

export interface VendusHttpOptions {
  apiKey: string;
  /** Default: https://www.vendus.co.ao/ws/v1.1 */
  baseUrl?: string;
  timeoutMs?: number;
}

export interface RateLimit {
  limit: number | null;
  remaining: number | null;
  used: number | null;
  reset: number | null;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export class VendusHttp {
  private readonly apiKey: string;
  /** Base da API (ex.: https://www.vendus.co.ao/ws/v1.1), sem barra final. */
  readonly baseUrl: string;
  private readonly timeoutMs: number;

  /** Estado do rate-limit da última resposta. */
  rateLimit: RateLimit = { limit: null, remaining: null, used: null, reset: null };

  constructor(opts: VendusHttpOptions) {
    if (!opts.apiKey) throw new Error("VendusHttp: apiKey em falta");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://www.vendus.co.ao/ws/v1.1").replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? 20000;
  }

  get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>("GET", path, { query });
  }
  post<T>(path: string, body?: unknown, query?: Query): Promise<T> {
    return this.request<T>("POST", path, { body, query });
  }
  patch<T>(path: string, body?: unknown, query?: Query): Promise<T> {
    return this.request<T>("PATCH", path, { body, query });
  }
  del<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>("DELETE", path, { query });
  }

  /** GET que devolve texto cru (ex.: PDF base64, HTML, ESC/POS). */
  getRaw(path: string, query?: Query): Promise<string> {
    return this.request<string>("GET", path, { query, raw: true });
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; query?: Query; raw?: boolean } = {},
  ): Promise<T> {
    const url = this.baseUrl + this.normalizePath(path) + this.buildQuery(opts.query);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    let payload: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(opts.body);
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: payload,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e: any) {
      throw new VendusError(`Falha de rede ao contactar Vendus: ${e?.message ?? e}`, 0);
    }

    this.captureRateLimit(res);

    const text = await res.text();
    if (!res.ok) {
      const parsed = this.safeJson(text);
      const msg =
        (parsed as any)?.errors?.[0]?.message ||
        (parsed as any)?.message ||
        `Vendus respondeu ${res.status}`;
      throw new VendusError(msg, res.status, parsed ?? text);
    }

    if (opts.raw) return text as unknown as T;
    return (text ? this.safeJson(text) : null) as T;
  }

  private normalizePath(path: string): string {
    return path.startsWith("/") ? path : `/${path}`;
  }

  private buildQuery(query?: Query): string {
    if (!query) return "";
    const parts: string[] = [];
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
    return parts.length ? `?${parts.join("&")}` : "";
  }

  private captureRateLimit(res: Response): void {
    const num = (h: string): number | null => {
      const v = res.headers.get(h);
      return v == null ? null : Number(v);
    };
    this.rateLimit = {
      limit: num("Rate-Limit-Limit"),
      remaining: num("Rate-Limit-Remaining"),
      used: num("Rate-Limit-Used"),
      reset: num("Rate-Limit-Reset"),
    };
  }

  private safeJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
