import { BaseModel } from "./base.model";
import {CustomShowDTO} from "../dtos/index";
export interface ICoupon {
  id?: number;
  name: string;
  code: string;
  active: boolean;
  amount: number;
  commission: number;
  expire_at?: string | null;
}

export class CouponModel extends BaseModel {
  static tableName = "coupons";
  static allowedColumns = ["id","name","code","active","amount","percentage","expire_at","created_at","updated_at"];
  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }
  static async findOneById(
      { id, columns = ["*"], with: withRelations = [] }: CustomShowDTO,
      connection?: any
  ): Promise<ICoupon | null> {
    if (!id) throw new Error("O campo 'id' é obrigatório.");
    const conn = this.getConnection(connection);
    // Monta as colunas que serão retornadas
    const SAFE = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
    const safe = columns.filter(c => c === "*" || SAFE.test(c));
    const cols = safe.length ? safe.join(", ") : "*";
    // Base query
    let sql = `SELECT ${cols} FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const params: any[] = [id];
    if (withRelations.length) {
      for (const relation of withRelations) {
        switch (relation) {}
      }
    }
    const [rows] = await conn.execute(sql, params);
    return (rows as any[])[0] || null;
  }
}
