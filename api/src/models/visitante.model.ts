import { BaseModel } from "./base.model";
import { ObraModel } from "./obra.model";

export interface IVisitante {
  id?: number;
  obra_id: number;
  nome: string;
  empresa?: string | null;
  motivo?: string | null;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  anfitriao?: string | null;
  qr_token?: string;
  valido_de?: string | null;
  valido_ate?: string | null;
  estado: "previsto" | "ativo" | "encerrado";
}

export class VisitanteModel extends BaseModel {
  static tableName = "visitantes";
  static allowedColumns = [
    "id", "obra_id", "nome", "empresa", "motivo", "telefone", "email",
    "documento", "anfitriao", "valido_de", "valido_ate", "estado",
    "created_at", "updated_at",
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

  static async obra(visitante: any, connection?: any): Promise<any | null> {
    if (!visitante.obra_id) return null;
    return await ObraModel.findOneBy("id", visitante.obra_id, connection);
  }
}
