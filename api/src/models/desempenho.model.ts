import { BaseModel } from "./base.model";

export interface IDesempenho {
  id?: number;
  obra_id: number;
  trabalhador_id: number;
  metrica_id: number;
  data: string;
  quantidade: number;
  registado_por?: number | null;
  obs?: string | null;
}

export class DesempenhoModel extends BaseModel {
  static tableName = "desempenhos";
  static allowedColumns = [
    "id", "obra_id", "trabalhador_id", "metrica_id", "data", "quantidade",
    "registado_por", "obs", "created_at", "updated_at",
  ];
  static allowedRelations = ["trabalhador", "metrica"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async trabalhador(row: any, connection?: any): Promise<any | null> {
    if (!row.trabalhador_id) return null;
    const rows = await this.query(
      `SELECT id, nome, funcao FROM trabalhadores WHERE id = ? LIMIT 1`,
      [row.trabalhador_id], connection
    );
    return rows[0] || null;
  }

  static async metrica(row: any, connection?: any): Promise<any | null> {
    if (!row.metrica_id) return null;
    const rows = await this.query(
      `SELECT id, nome, unidade FROM metricas_desempenho WHERE id = ? LIMIT 1`,
      [row.metrica_id], connection
    );
    return rows[0] || null;
  }
}
