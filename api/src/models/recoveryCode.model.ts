import { BaseModel } from "./base.model";

export interface RecoveryCode {
  id?: number
  phone: string
  code: string
  token?: string | null
  used?: boolean
  expires_at: Date
  
  updated_at?: string
}

export class RecoveryCodeModel extends BaseModel {
  static tableName = "recovery_codes"

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection)
  }

  static async findLatestByPhone(phone: string, connection?: any): Promise<RecoveryCode | null> {
    const conn = (this as any).getConnection(connection)
    const [rows] = await conn.execute(
      `SELECT * FROM ${this.tableName} WHERE phone = ? ORDER BY created_at DESC LIMIT 1`,
      [phone]
    )
    return (rows as any[])[0] || null
  }

  static async updateToken(id: number, token: string, connection?: any): Promise<void> {
    const conn = (this as any).getConnection(connection)
    await conn.execute(
      `UPDATE ${this.tableName} SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [token, id]
    )
  }

  static async invalidate(id: number, connection?: any): Promise<void> {
    const conn = (this as any).getConnection(connection)
    await conn.execute(
      `UPDATE ${this.tableName} SET used = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    )
  }
}
