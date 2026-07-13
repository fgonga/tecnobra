import { BaseModel } from './base.model'

export class SavedAnalysesModel extends BaseModel {
  static tableName = 'saved_analyses'
  static allowedColumns = ['id', 'user_id', 'name', 'periods_config', 'report_snapshots', 'ai_analysis', 'created_at']

  static async findByUser(userId: number): Promise<any[]> {
    const rows = await this.query(
      'SELECT id, user_id, name, periods_config, ai_analysis, created_at FROM saved_analyses WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return rows.map((r: any) => ({
      ...r,
      periods_config: typeof r.periods_config === 'string' ? JSON.parse(r.periods_config) : r.periods_config,
    }))
  }

  static async findByIdAndUser(id: number, userId: number): Promise<any | null> {
    const rows = await this.query(
      'SELECT * FROM saved_analyses WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    )
    const row = rows[0]
    if (!row) return null
    return {
      ...row,
      periods_config:   typeof row.periods_config   === 'string' ? JSON.parse(row.periods_config)   : row.periods_config,
      report_snapshots: typeof row.report_snapshots === 'string' ? JSON.parse(row.report_snapshots) : row.report_snapshots,
    }
  }

  static async deleteByIdAndUser(id: number, userId: number): Promise<boolean> {
    const result: any = await this.query(
      'DELETE FROM saved_analyses WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return (result?.affectedRows ?? 0) > 0
  }
}
