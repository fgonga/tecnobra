import { BaseModel } from "./base.model";
import { ObraModel } from "./obra.model";
import { EmpresaModel } from "./empresa.model";

export interface ITrabalhador {
  id?: number;
  obra_id: number;
  empresa_id: number;
  nome: string;
  funcao?: string | null;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  foto?: string | null;
  qr_token?: string;
  cartao_estado: "ativo" | "revogado";
  cartao_emitido_em?: string | null;
  estado: "ativo" | "suspenso" | "inativo";
}

export class TrabalhadorModel extends BaseModel {
  static tableName = "trabalhadores";
  static allowedColumns = [
    "id", "obra_id", "empresa_id", "nome", "funcao", "telefone", "email",
    "documento", "foto", "cartao_estado", "cartao_emitido_em", "estado",
    "created_at", "updated_at",
  ];
  // O token do cartão nunca é devolvido em listagens/consultas genéricas —
  // apenas os endpoints de cartão (emitir/cartão público) o utilizam.
  static sensitiveColumns = ["qr_token"];
  static allowedRelations = ["obra", "empresa"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async paginate(options: any = {}, connection?: any): Promise<any> {
    const result = await super.paginate(options, connection);
    for (const row of result.data ?? []) delete row.qr_token;
    return result;
  }

  static async obra(trabalhador: any, connection?: any): Promise<any | null> {
    if (!trabalhador.obra_id) return null;
    return await ObraModel.findOneBy("id", trabalhador.obra_id, connection);
  }

  static async empresa(trabalhador: any, connection?: any): Promise<any | null> {
    if (!trabalhador.empresa_id) return null;
    return await EmpresaModel.findOneBy("id", trabalhador.empresa_id, connection);
  }

  static async findByToken(token: string, connection?: any): Promise<any | null> {
    return await this.findOneBy("qr_token", token, connection);
  }
}
