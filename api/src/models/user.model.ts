import {BaseModel} from "./base.model";
import argon2 from "argon2";

export type UserType = "superadmin" | "admin" | "user" | "account" | "helper";
export type SystemRules =
  | "*" | "dashboard" | "obras" | "empresas" | "trabalhadores" | "portaria"
  | "equipamentos" | "materiais" | "visitantes" | "veiculos" | "desempenho"
  | "alertas" | "reports" | "users" | "configs";

export interface User {
  id?: number;
  name: string;
  username: string;
  phone: string;
  password: string;
  status: number;
  role?: UserType;
}

export class UserModel extends BaseModel {
  static tableName = "users";
  static allowedColumns = ["id","name","username","phone","email","status","role","created_at","updated_at"];
  static sensitiveColumns = ["password"];
  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    if (data.password) {
      data.password = await argon2.hash(data.password);
    } else {
      data.password = await argon2.hash("tecnobra");
    }
    const created = await this.genericCreate(data, connection);
    delete created.password;
    if (data.role) {
      const { ProfileModel } = await import("./profile.model");
      await ProfileModel.assignDefaultProfile(created.id, data.role);
    }
    return created;
  }
  static async findOneBy(column: string, value: any, connection?: any): Promise<any | null> {
    const row = await super.findOneBy(column, value, connection);
    if (row) delete row.password;
    return row;
  }
  static async findOneByWithPassword(column: string, value: any, connection?: any): Promise<any | null> {
    return await super.findOneBy(column, value, connection);
  }
  static async findAllBy(column: string, value: any, connection?: any): Promise<any[]> {
    const rows = await super.findAllBy(column, value, connection);
    return rows.map((r) => {
      delete r.password;
      return r;
    });
  }

  static async paginate(options: any = {}, connection?: any): Promise<any> {
    const result = await super.paginate(options, connection);
    result.data = result.data.map((r: any) => {
      delete r.password;
      return r;
    });
    return result;
  }

  static async updateByPhone(phone: string, data: Record<string, any>, connection?: any): Promise<void> {
    const conn = (this as any).getConnection(connection);

    if (data.password) {
      data.password = await argon2.hash(data.password);
    }

    const columns = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
    const values = Object.values(data);

    await conn.execute(
        `UPDATE ${this.tableName} SET ${columns}, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`,
        [...values, phone]
    );
  }

  static async update(id: string | number, data: Record<string, any>, connection?: any): Promise<any> {
    if (data.password) {
      data.password = await argon2.hash(data.password);
    }
    await super.update(id, data, connection);
    const updated = await super.findOneBy("id", id, connection);
    if (updated) delete updated.password;
    return updated;
  }

}
