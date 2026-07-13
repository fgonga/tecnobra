import { BaseModel } from "./base.model";

export interface IMetricaDesempenho {
  id?: number;
  nome: string;
  unidade: string;
  descricao?: string | null;
}

export class MetricaDesempenhoModel extends BaseModel {
  static tableName = "metricas_desempenho";
  static allowedColumns = ["id", "nome", "unidade", "descricao", "created_at", "updated_at"];
  static allowedRelations: string[] = [];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }
}
