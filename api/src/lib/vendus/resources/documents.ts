/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Recurso "documents" do Vendus — emitir (faturar), anular, consultar, listar.
 *  https://www.vendus.co.ao/ws/v1.1/documents.doc
 */

import type { VendusHttp } from "../VendusHttp";
import type {
  CreateDocumentInput,
  DocumentOutput,
  ListDocumentsParams,
  VendusDocument,
  VendusMode,
} from "../types";

export class DocumentsResource {
  constructor(
    private readonly http: VendusHttp,
    private readonly defaults: { registerId?: number; mode: VendusMode },
  ) {}

  /**
   * Emite um documento (faturar). Ex.: type "FR" (fatura-recibo) para uma venda paga.
   * register_id e mode caem para os defaults do cliente SDK se não forem passados.
   */
  create(input: CreateDocumentInput): Promise<VendusDocument> {
    const body: CreateDocumentInput = {
      ...input,
      register_id: input.register_id ?? this.defaults.registerId,
      mode: input.mode ?? this.defaults.mode,
    };
    return this.http.post<VendusDocument>("/documents/", body);
  }

  /**
   * Anula um documento (status "A"). Em produção a Vendus pode exigir motivo;
   * passe-o em `reason` (vai como nota da anulação quando suportado).
   */
  cancel(id: number, reason?: string): Promise<VendusDocument> {
    const body: Record<string, unknown> = { status: "A", mode: this.defaults.mode };
    if (reason) body.notes = reason;
    return this.http.patch<VendusDocument>(`/documents/${id}/`, body);
  }

  /** Consulta um documento por id. */
  get(id: number, params?: { mode?: VendusMode; output?: DocumentOutput; return_qrcode?: 0 | 1 }):
    Promise<VendusDocument> {
    return this.http.get<VendusDocument>(`/documents/${id}/`, {
      mode: params?.mode ?? this.defaults.mode,
      output: params?.output,
      return_qrcode: params?.return_qrcode,
    });
  }

  /** Lista/filtra documentos. */
  list(params?: ListDocumentsParams): Promise<VendusDocument[]> {
    return this.http.get<VendusDocument[]>("/documents/", { ...params });
  }

  /** Devolve o PDF do documento (string base64/binária conforme a API). */
  getPdf(id: number): Promise<string> {
    return this.http.getRaw(`/documents/${id}.pdf`);
  }

  /**
   * URL do PDF do documento (output=pdf_url). O Vendus devolve o link em
   * `output_data.content` codificado em base64 (caminho relativo à API);
   * descodificamos e construímos o URL absoluto.
   */
  async getPdfUrl(id: number): Promise<string | null> {
    const doc = await this.http.get<any>(`/documents/${id}/`, {
      mode: this.defaults.mode,
      output: "pdf_url",
    });
    // Compatibilidade: algumas respostas trazem o URL direto.
    const direct = doc?.output ?? doc?.pdf_url;
    if (typeof direct === "string" && direct) return direct;

    const content = doc?.output_data?.content;
    if (typeof content === "string" && content) {
      let path = content;
      try { path = Buffer.from(content, "base64").toString("utf8"); } catch { /* já era texto */ }
      if (/^https?:\/\//i.test(path)) return path;
      return `${this.http.baseUrl}/${path.replace(/^\/+/, "")}`;
    }
    return null;
  }
}
