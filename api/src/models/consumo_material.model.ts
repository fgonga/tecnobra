import { BaseModel } from "./base.model";

export interface IConsumoMaterial {
  id?: number;
  obra_id: number;
  material_id: number;
  quantidade: number;
  trabalhador_id?: number | null;
  registado_por?: number | null;
  ocorrido_em?: string;
  obs?: string | null;
}

export class ConsumoMaterialModel extends BaseModel {
  static tableName = "consumos_materiais";
  static allowedColumns = [
    "id", "obra_id", "material_id", "quantidade", "trabalhador_id",
    "registado_por", "ocorrido_em", "obs", "created_at",
  ];
  static allowedRelations = ["material", "trabalhador"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async material(consumo: any, connection?: any): Promise<any | null> {
    if (!consumo.material_id) return null;
    const rows = await this.query(
      `SELECT id, nome, unidade FROM materiais WHERE id = ? LIMIT 1`,
      [consumo.material_id], connection
    );
    return rows[0] || null;
  }

  static async trabalhador(consumo: any, connection?: any): Promise<any | null> {
    if (!consumo.trabalhador_id) return null;
    const rows = await this.query(
      `SELECT id, nome FROM trabalhadores WHERE id = ? LIMIT 1`,
      [consumo.trabalhador_id], connection
    );
    return rows[0] || null;
  }
}
