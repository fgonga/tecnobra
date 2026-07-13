import { BaseModel } from "./base.model";

export interface IOrcamentoMaterial {
  id?: number;
  obra_id: number;
  material_id: number;
  quantidade_orcada: number;
  obs?: string | null;
}

export class OrcamentoMaterialModel extends BaseModel {
  static tableName = "orcamentos_materiais";
  static allowedColumns = [
    "id", "obra_id", "material_id", "quantidade_orcada", "obs",
    "created_at", "updated_at",
  ];
  static allowedRelations = ["material"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async material(orcamento: any, connection?: any): Promise<any | null> {
    if (!orcamento.material_id) return null;
    const rows = await this.query(
      `SELECT id, nome, unidade FROM materiais WHERE id = ? LIMIT 1`,
      [orcamento.material_id], connection
    );
    return rows[0] || null;
  }
}
