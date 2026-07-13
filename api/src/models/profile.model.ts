import { BaseModel } from "./base.model";
import { db } from "../db/db";

export const ALL_SYSTEM_RULES = [
  "dashboard", "obras", "empresas", "trabalhadores", "portaria",
  "equipamentos", "materiais", "visitantes", "veiculos", "desempenho",
  "alertas", "reports", "users", "configs", "*",
] as const;

export class ProfileModel extends BaseModel {
  static tableName = "profiles";

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate({ name: data.name, description: data.description ?? null }, connection);
  }

  // ─── Profile Rules ─────────────────────────────────────────────────────────

  static async getRules(profileId: number): Promise<string[]> {
    const rows = await this.query<any>(
      `SELECT rule FROM profile_rules WHERE profile_id = ? ORDER BY rule`,
      [profileId]
    );
    return rows.map((r: any) => r.rule);
  }

  static async addRule(profileId: number, rule: string): Promise<void> {
    await this.query(
      `INSERT IGNORE INTO profile_rules (profile_id, rule) VALUES (?, ?)`,
      [profileId, rule]
    );
  }

  static async removeRule(profileId: number, rule: string): Promise<void> {
    await this.query(
      `DELETE FROM profile_rules WHERE profile_id = ? AND rule = ?`,
      [profileId, rule]
    );
  }

  static async setRules(profileId: number, rules: string[]): Promise<void> {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      await conn.execute(`DELETE FROM profile_rules WHERE profile_id = ?`, [profileId]);
      for (const rule of rules) {
        await conn.execute(
          `INSERT IGNORE INTO profile_rules (profile_id, rule) VALUES (?, ?)`,
          [profileId, rule]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  static async getWithRules(profileId: number): Promise<any | null> {
    const profile = await this.findOneById({ id: profileId });
    if (!profile) return null;
    profile.rules = await this.getRules(profileId);
    return profile;
  }

  static async paginateWithRules(options: any = {}): Promise<any> {
    const result = await this.paginate(options);
    for (const profile of result.data) {
      profile.rules = await this.getRules(profile.id);
    }
    return result;
  }

  // ─── User ↔ Profile ────────────────────────────────────────────────────────

  static async getUserProfiles(userId: number): Promise<any[]> {
    const rows = await this.query<any>(
      `SELECT p.*,
              GROUP_CONCAT(pr.rule ORDER BY pr.rule SEPARATOR ',') AS rules_raw
       FROM profiles p
       JOIN user_profiles up ON up.profile_id = p.id
       LEFT JOIN profile_rules pr ON pr.profile_id = p.id
       WHERE up.user_id = ?
       GROUP BY p.id
       ORDER BY p.name`,
      [userId]
    );
    return rows.map((r: any) => ({ ...r, rules: r.rules_raw ? r.rules_raw.split(',') : [], rules_raw: undefined }));
  }

  static async assignToUser(userId: number, profileId: number): Promise<void> {
    await this.query(
      `INSERT IGNORE INTO user_profiles (user_id, profile_id) VALUES (?, ?)`,
      [userId, profileId]
    );
  }

  static async removeFromUser(userId: number, profileId: number): Promise<void> {
    await this.query(
      `DELETE FROM user_profiles WHERE user_id = ? AND profile_id = ?`,
      [userId, profileId]
    );
  }

  // ─── User Individual Rules ─────────────────────────────────────────────────

  static async getUserIndividualRules(userId: number): Promise<string[]> {
    const rows = await this.query<any>(
      `SELECT rule FROM user_rules WHERE user_id = ? ORDER BY rule`,
      [userId]
    );
    return rows.map((r: any) => r.rule);
  }

  static async addUserRule(userId: number, rule: string): Promise<void> {
    await this.query(
      `INSERT IGNORE INTO user_rules (user_id, rule) VALUES (?, ?)`,
      [userId, rule]
    );
  }

  static async removeUserRule(userId: number, rule: string): Promise<void> {
    await this.query(
      `DELETE FROM user_rules WHERE user_id = ? AND rule = ?`,
      [userId, rule]
    );
  }

  static async setUserRules(userId: number, rules: string[]): Promise<void> {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      await conn.execute(`DELETE FROM user_rules WHERE user_id = ?`, [userId]);
      for (const rule of rules) {
        await conn.execute(
          `INSERT IGNORE INTO user_rules (user_id, rule) VALUES (?, ?)`,
          [userId, rule]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ─── Effective Rules (profiles + individual) ───────────────────────────────

  static async getUserEffectiveRules(userId: number): Promise<string[]> {
    const [profileRules, userRules] = await Promise.all([
      this.query<any>(
        `SELECT DISTINCT pr.rule
         FROM profile_rules pr
         JOIN user_profiles up ON up.profile_id = pr.profile_id
         WHERE up.user_id = ?`,
        [userId]
      ),
      this.query<any>(
        `SELECT rule FROM user_rules WHERE user_id = ?`,
        [userId]
      ),
    ]);
    const all = [
      ...profileRules.map((r: any) => r.rule),
      ...userRules.map((r: any) => r.rule),
    ];
    return [...new Set(all)];
  }

  static async getUserPermissions(userId: number): Promise<{
    profiles: any[];
    individual_rules: string[];
    effective_rules: string[];
  }> {
    const [profiles, individual_rules, effective_rules] = await Promise.all([
      this.getUserProfiles(userId),
      this.getUserIndividualRules(userId),
      this.getUserEffectiveRules(userId),
    ]);
    return { profiles, individual_rules, effective_rules };
  }

  // ─── Auto-assign default profile by role ──────────────────────────────────

  static readonly ROLE_TO_PROFILE: Record<string, string> = {
    superadmin: "Administrador",
    admin:      "Administrador",
    user:       "Encarregado",
    helper:     "Portaria",
  };

  static async assignDefaultProfile(userId: number, role: string): Promise<void> {
    const profileName = this.ROLE_TO_PROFILE[role];
    if (!profileName) return;
    const profile = await this.findOneBy("name", profileName);
    if (profile) await this.assignToUser(userId, profile.id);
  }
}
