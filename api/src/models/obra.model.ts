import { BaseModel } from "./base.model";

export interface IObra {
  id?: number;
  nome: string;
  codigo: string;
  endereco?: string | null;
  cliente?: string | null;
  estado: "ativa" | "pausada" | "concluida";
  data_inicio?: string | null;
  data_fim_prevista?: string | null;
  responsavel_user_id?: number | null;
}

export class ObraModel extends BaseModel {
  static tableName = "obras";
  static allowedColumns = [
    "id", "nome", "codigo", "endereco", "cliente", "estado",
    "data_inicio", "data_fim_prevista", "responsavel_user_id",
    "created_at", "updated_at",
  ];
  static allowedRelations = ["responsavel"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async responsavel(obra: any, connection?: any): Promise<any | null> {
    if (!obra.responsavel_user_id) return null;
    const rows = await this.query(
      `SELECT id, name, username, phone, email FROM users WHERE id = ? LIMIT 1`,
      [obra.responsavel_user_id],
      connection
    );
    return rows[0] || null;
  }
}
