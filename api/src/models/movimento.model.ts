import { BaseModel } from "./base.model";

export type TipoEntidade = "trabalhador" | "visitante" | "veiculo";
export type Direcao = "entrada" | "saida";
export type MetodoRegisto = "qr" | "manual" | "ocr";

export interface IMovimento {
  id?: number;
  obra_id: number;
  tipo_entidade: TipoEntidade;
  trabalhador_id?: number | null;
  visitante_id?: number | null;
  veiculo_id?: number | null;
  direcao: Direcao;
  metodo: MetodoRegisto;
  portao?: string | null;
  registado_por?: number | null;
  ocorrido_em?: string;
  obs?: string | null;
}

export class MovimentoModel extends BaseModel {
  static tableName = "movimentos";
  static allowedColumns = [
    "id", "obra_id", "tipo_entidade", "trabalhador_id", "visitante_id",
    "veiculo_id", "direcao", "metodo", "portao", "registado_por",
    "ocorrido_em", "obs", "created_at",
  ];
  static allowedRelations = ["trabalhador", "visitante", "veiculo", "obra"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async trabalhador(mov: any, connection?: any): Promise<any | null> {
    if (!mov.trabalhador_id) return null;
    const rows = await this.query(
      `SELECT id, nome, funcao, foto FROM trabalhadores WHERE id = ? LIMIT 1`,
      [mov.trabalhador_id], connection
    );
    return rows[0] || null;
  }

  static async visitante(mov: any, connection?: any): Promise<any | null> {
    if (!mov.visitante_id) return null;
    const rows = await this.query(
      `SELECT id, nome, motivo, empresa FROM visitantes WHERE id = ? LIMIT 1`,
      [mov.visitante_id], connection
    );
    return rows[0] || null;
  }

  static async veiculo(mov: any, connection?: any): Promise<any | null> {
    if (!mov.veiculo_id) return null;
    const rows = await this.query(
      `SELECT id, matricula, marca_modelo, tipo FROM veiculos WHERE id = ? LIMIT 1`,
      [mov.veiculo_id], connection
    );
    return rows[0] || null;
  }

  static async obra(mov: any, connection?: any): Promise<any | null> {
    if (!mov.obra_id) return null;
    const rows = await this.query(
      `SELECT id, nome, codigo FROM obras WHERE id = ? LIMIT 1`,
      [mov.obra_id], connection
    );
    return rows[0] || null;
  }

  /** Último movimento de uma entidade (para inferir a direção seguinte). */
  static async lastForEntity(tipo: TipoEntidade, entityId: number, connection?: any): Promise<any | null> {
    const col = tipo === "trabalhador" ? "trabalhador_id" : tipo === "visitante" ? "visitante_id" : "veiculo_id";
    const rows = await this.query(
      `SELECT * FROM ${this.tableName} WHERE ${col} = ? ORDER BY ocorrido_em DESC, id DESC LIMIT 1`,
      [entityId], connection
    );
    return rows[0] || null;
  }
}
