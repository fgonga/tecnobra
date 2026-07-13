import { BaseModel } from "./base.model";
export interface CourseRelation {
    id?: number;
    course_id: number;
    related_course_id: number;
  
   
}

export class CourseRelationModel extends BaseModel {
    static tableName = "course_relations";

    static async create(data: Record<string, any>, connection?: any): Promise<any> {
        return this.genericCreate(data, connection);
    }

    static async findByCourseId(course_id: number, connection?: any): Promise<any[]> {
        const conn = (this as any).getConnection(connection);
        const [rows] = await conn.execute(
            `SELECT * FROM ${this.tableName} WHERE course_id = ?`,
            [course_id]
        );
        return rows;
    }
}






