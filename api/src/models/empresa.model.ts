import { BaseModel } from "./base.model";

export type EmpresaTipo = "empreiteiro" | "subempreiteiro" | "fornecedor" | "fiscalizacao" | "outro";

export interface IEmpresa {
  id?: number;
  nome: string;
  nif?: string | null;
  tipo: EmpresaTipo;
  contacto_nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  estado: "ativa" | "inativa";
}

export class EmpresaModel extends BaseModel {
  static tableName = "empresas";
  static allowedColumns = [
    "id", "nome", "nif", "tipo", "contacto_nome", "telefone", "email",
    "estado", "created_at", "updated_at",
  ];
  static allowedRelations: string[] = [];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }
}
