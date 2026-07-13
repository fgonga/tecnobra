import { BaseModel } from "./base.model";
import { ObraModel } from "./obra.model";

export type EquipamentoEstado = "disponivel" | "em_uso" | "danificado" | "fora_servico" | "desaparecido";

export interface IEquipamento {
  id?: number;
  obra_id: number;
  nome: string;
  codigo?: string | null;
  categoria: "equipamento" | "ferramenta";
  numero_serie?: string | null;
  qr_token?: string;
  estado: EquipamentoEstado;
  trabalhador_atual_id?: number | null;
  foto?: string | null;
  obs?: string | null;
}

export class EquipamentoModel extends BaseModel {
  static tableName = "equipamentos";
  static allowedColumns = [
    "id", "obra_id", "nome", "codigo", "categoria", "numero_serie",
    "estado", "trabalhador_atual_id", "foto", "obs",
    "created_at", "updated_at",
  ];
  static sensitiveColumns = ["qr_token"];
  static allowedRelations = ["obra", "trabalhador_atual"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async paginate(options: any = {}, connection?: any): Promise<any> {
    const result = await super.paginate(options, connection);
    for (const row of result.data ?? []) delete row.qr_token;
    return result;
  }

  static async obra(equipamento: any, connection?: any): Promise<any | null> {
    if (!equipamento.obra_id) return null;
    return await ObraModel.findOneBy("id", equipamento.obra_id, connection);
  }

  static async trabalhador_atual(equipamento: any, connection?: any): Promise<any | null> {
    if (!equipamento.trabalhador_atual_id) return null;
    const rows = await this.query(
      `SELECT id, nome, funcao, foto FROM trabalhadores WHERE id = ? LIMIT 1`,
      [equipamento.trabalhador_atual_id], connection
    );
    return rows[0] || null;
  }
}
