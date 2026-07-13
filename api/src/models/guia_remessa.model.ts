import { BaseModel } from "./base.model";

export interface IGuiaRemessaItem {
  id?: number;
  guia_id?: number;
  material_id: number;
  quantidade: number;
  preco_unitario?: number | null;
}

export interface IGuiaRemessa {
  id?: number;
  obra_id: number;
  numero: string;
  fornecedor_empresa_id?: number | null;
  fornecedor_nome?: string | null;
  data_entrega: string;
  recebido_por?: number | null;
  documento?: string | null;
  obs?: string | null;
  itens?: IGuiaRemessaItem[];
}

export class GuiaRemessaModel extends BaseModel {
  static tableName = "guias_remessa";
  static allowedColumns = [
    "id", "obra_id", "numero", "fornecedor_empresa_id", "fornecedor_nome",
    "data_entrega", "recebido_por", "documento", "obs",
    "created_at", "updated_at",
  ];
  static allowedRelations = ["itens", "obra", "fornecedor"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async itens(guia: any, connection?: any): Promise<any[]> {
    return await this.query(
      `SELECT gi.*, m.nome AS material_nome, m.unidade
       FROM guias_remessa_itens gi
       INNER JOIN materiais m ON m.id = gi.material_id
       WHERE gi.guia_id = ?`,
      [guia.id], connection
    );
  }

  static async obra(guia: any, connection?: any): Promise<any | null> {
    if (!guia.obra_id) return null;
    const rows = await this.query(
      `SELECT id, nome, codigo FROM obras WHERE id = ? LIMIT 1`,
      [guia.obra_id], connection
    );
    return rows[0] || null;
  }

  static async fornecedor(guia: any, connection?: any): Promise<any | null> {
    if (!guia.fornecedor_empresa_id) return null;
    const rows = await this.query(
      `SELECT id, nome FROM empresas WHERE id = ? LIMIT 1`,
      [guia.fornecedor_empresa_id], connection
    );
    return rows[0] || null;
  }
}
