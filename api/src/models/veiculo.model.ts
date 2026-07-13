import { BaseModel } from "./base.model";
import { ObraModel } from "./obra.model";

export interface IVeiculo {
  id?: number;
  obra_id: number;
  matricula: string;
  foto?: string | null;
  marca_modelo?: string | null;
  tipo: "ligeiro" | "pesado" | "maquina" | "outro";
  proprietario_tipo: "empresa" | "trabalhador" | "visitante" | "outro";
  proprietario_nome?: string | null;
  ocr_matricula?: string | null;
  ocr_confianca?: number | null;
}

export class VeiculoModel extends BaseModel {
  static tableName = "veiculos";
  static allowedColumns = [
    "id", "obra_id", "matricula", "foto", "marca_modelo", "tipo",
    "proprietario_tipo", "proprietario_nome", "ocr_matricula", "ocr_confianca",
    "created_at", "updated_at",
  ];
  static allowedRelations = ["obra"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async obra(veiculo: any, connection?: any): Promise<any | null> {
    if (!veiculo.obra_id) return null;
    return await ObraModel.findOneBy("id", veiculo.obra_id, connection);
  }

  static async findByMatricula(obraId: number, matricula: string, connection?: any): Promise<any | null> {
    const rows = await this.query(
      `SELECT * FROM ${this.tableName} WHERE obra_id = ? AND matricula = ? LIMIT 1`,
      [obraId, matricula], connection
    );
    return rows[0] || null;
  }
}
