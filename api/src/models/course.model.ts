import { BaseModel } from "./base.model";

export interface Course {
  id?: number;
  name: string;
  slug: string;
  thinkific_id: string;
  thinkific_type: string;
  course_card_image_url: string;
  description: string;
  product_id: string;            // id do produto no Thinkific (sync) — NÃO é o do Vendus
  vendus_product_id?: string;    // id do produto no catálogo Vendus
  vendus_product_name?: string;  // nome do produto Vendus (snapshot no momento da ligação)
  price:number;
  days_until_expiry:number;
  levels:any;
  cefr_levels?:any;              // array de níveis CEFR alvo, ex: ["A1","A2"] (null = geral)
}
export class CourseModel extends BaseModel {
  static tableName = "courses";
  static allowedColumns = ["id", "name", "slug", "thinkific_id", "thinkific_type", "product_id", "vendus_product_id", "vendus_product_name", "price", "days_until_expiry", "cefr_levels", "created_at", "updated_at"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async updateBySlug(slug: string, data: Record<string, any>, connection?: any): Promise<void> {
    const conn = (this as any).getConnection(connection);
    const columns = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
    const values = Object.values(data);

    await conn.execute(
        `UPDATE ${this.tableName} SET ${columns} WHERE slug = ?`,
        [...values, slug]
    );
  }

  static async findRelatedCourses(courseId: number, connection?: any): Promise<any[]> {
    const conn = (this as any).getConnection(connection);
    const [rows] = await conn.execute(
        `
        SELECT c.*
        FROM course_relations cr
        JOIN courses c ON c.id = cr.related_course_id
        WHERE cr.course_id = ?
      `,
        [courseId]
    );
    return rows;
  }
}
