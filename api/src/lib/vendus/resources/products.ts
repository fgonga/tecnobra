/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Recurso "products" do Vendus — CRUD de produtos/serviços.
 *  https://www.vendus.co.ao/ws/v1.1/products.doc
 */

import type { VendusHttp } from "../VendusHttp";
import type {
  CreateProductInput,
  ListProductsParams,
  UpdateProductInput,
  VendusProduct,
} from "../types";

export class ProductsResource {
  constructor(private readonly http: VendusHttp) {}

  /** Cria um produto/serviço. Requer title e unit_id. */
  create(input: CreateProductInput): Promise<VendusProduct> {
    return this.http.post<VendusProduct>("/products/", input);
  }

  /** Consulta um produto por id. */
  get(id: number): Promise<VendusProduct> {
    return this.http.get<VendusProduct>(`/products/${id}/`);
  }

  /** Lista/filtra produtos. */
  list(params?: ListProductsParams): Promise<VendusProduct[]> {
    return this.http.get<VendusProduct[]>("/products/", { ...params });
  }

  /** Atualização parcial. */
  update(id: number, input: UpdateProductInput): Promise<VendusProduct> {
    return this.http.patch<VendusProduct>(`/products/${id}/`, input);
  }

  /** Desativa o produto (status "off") — alternativa segura ao delete. */
  deactivate(id: number): Promise<VendusProduct> {
    return this.update(id, { status: "off" });
  }

  /** Apaga o produto. Prefira deactivate() se houver documentos associados. */
  remove(id: number): Promise<unknown> {
    return this.http.del(`/products/${id}/`);
  }

  /** Procura o primeiro produto por referência (helper anti-duplicado). */
  async findByReference(reference: string): Promise<VendusProduct | null> {
    const rows = await this.list({ reference });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }
}
