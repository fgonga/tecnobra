import { BaseModel } from "./base.model";
import { ObraModel } from "./obra.model";

export interface IMaterial {
  id?: number;
  obra_id: number;
  nome: string;
  unidade: string;
  categoria?: string | null;
  stock_atual?: number;
  stock_minimo?: number;
  qr_token?: string | null;
}

export class MaterialModel extends BaseModel {
  static tableName = "materiais";
  static allowedColumns = [
    "id", "obra_id", "nome", "unidade", "categoria",
    "stock_atual", "stock_minimo", "created_at", "updated_at",
  ];
  static sensitiveColumns = ["qr_token"];
  static allowedRelations = ["obra"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async paginate(options: any = {}, connection?: any): Promise<any> {
    const result = await super.paginate(options, connection);
    for (const row of result.data ?? []) delete row.qr_token;
    return result;
  }

  static async obra(material: any, connection?: any): Promise<any | null> {
    if (!material.obra_id) return null;
    return await ObraModel.findOneBy("id", material.obra_id, connection);
  }
}
