import { BaseModel } from "./base.model";

export interface IAlerta {
  id?: number;
  obra_id: number;
  tipo: "ferramenta_nao_devolvida" | "stock_baixo" | "visitante_nao_saiu" | "outro";
  referencia_tipo?: string | null;
  referencia_id?: number | null;
  mensagem: string;
  estado: "aberto" | "resolvido";
  resolvido_por?: number | null;
  resolvido_em?: string | null;
}

export class AlertaModel extends BaseModel {
  static tableName = "alertas";
  static allowedColumns = [
    "id", "obra_id", "tipo", "referencia_tipo", "referencia_id",
    "mensagem", "estado", "resolvido_por", "resolvido_em",
    "created_at", "updated_at",
  ];
  static allowedRelations = ["obra"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async obra(alerta: any, connection?: any): Promise<any | null> {
    if (!alerta.obra_id) return null;
    const rows = await this.query(
      `SELECT id, nome, codigo FROM obras WHERE id = ? LIMIT 1`,
      [alerta.obra_id], connection
    );
    return rows[0] || null;
  }
}
