import { BaseModel } from "./base.model";

export interface IMovimentoEquipamento {
  id?: number;
  equipamento_id: number;
  obra_id: number;
  trabalhador_id: number;
  tipo: "levantamento" | "devolucao";
  estado_devolucao?: "ok" | "danificado" | "desaparecido" | null;
  devolucao_prevista?: string | null;
  registado_por?: number | null;
  ocorrido_em?: string;
  obs?: string | null;
}

export class MovimentoEquipamentoModel extends BaseModel {
  static tableName = "movimentos_equipamento";
  static allowedColumns = [
    "id", "equipamento_id", "obra_id", "trabalhador_id", "tipo",
    "estado_devolucao", "devolucao_prevista", "registado_por",
    "ocorrido_em", "obs", "created_at",
  ];
  static allowedRelations = ["equipamento", "trabalhador"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async equipamento(mov: any, connection?: any): Promise<any | null> {
    if (!mov.equipamento_id) return null;
    const rows = await this.query(
      `SELECT id, nome, codigo, categoria, estado FROM equipamentos WHERE id = ? LIMIT 1`,
      [mov.equipamento_id], connection
    );
    return rows[0] || null;
  }

  static async trabalhador(mov: any, connection?: any): Promise<any | null> {
    if (!mov.trabalhador_id) return null;
    const rows = await this.query(
      `SELECT id, nome, funcao FROM trabalhadores WHERE id = ? LIMIT 1`,
      [mov.trabalhador_id], connection
    );
    return rows[0] || null;
  }
}
