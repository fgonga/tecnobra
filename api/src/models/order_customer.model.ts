// src/models/OrderCustomer.ts
import { db } from "../db/db";
import {BaseModel} from "./base.model";
export interface OrderCustomer {
    id?: number;
    order_id: number;
    name: string;
    email: string;
    phone?: string;
    thinkific_user_id?: string;
    thinkific_enrollment_id?: string;
    status?: "pending" | "completed" | "canceled";
}

export class OrderCustomerModel extends  BaseModel{
    static tableName = "order_customers";
    static async create(customer: OrderCustomer) {
        await db.execute(
            "INSERT INTO order_customers (order_id, name, email, phone, thinkific_user_id, status) VALUES (?, ?, ?, ?, ?, ?)",
            [ customer.order_id, customer.name, customer.email, customer.phone, customer.thinkific_user_id, customer.status || "pending"]
        );
    }
    static async findByOrder(order_id: string) {
        const [rows] = await db.execute(
            "SELECT * FROM order_customers WHERE order_id = ?",
            [order_id]
        );
        return rows as any[];
    }
    static async createMany(
        orderId: number,
        students: { name: string; email: string; phone?: string }[],
        connection?
    ): Promise<number[]> {
        const dbConn = connection || db;
        if (students.length === 0) return [];

        // Monta placeholders e valores
        const values: any[] = [];
        const placeholders = students
            .map(student => {
                values.push(orderId, student.name, student.email, student.phone || null);
                return "(?, ?, ?, ?)";
            })
            .join(", ");

        const sql = `
      INSERT INTO order_customers (order_id, name, email, phone)
      VALUES ${placeholders}
    `;

        const [result] = await dbConn.execute(sql, values);
        const firstId = (result as any).insertId as number;
        const ids: number[] = [];

        // Gera todos os IDs inseridos
        for (let i = 0; i < students.length; i++) {
            ids.push(firstId + i);
        }

        return ids;
    }
}
