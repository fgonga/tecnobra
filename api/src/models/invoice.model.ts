import { db } from "../db/db";
import { BaseModel } from "./base.model";
import { OrderModel } from "./order.model";

export interface Invoice {
    id?: number;
    order_id: number;
    provider?: string;            // vendus | manual | other
    external_id?: string | null;  // id do documento no provider
    type?: string;                // FR, FT, NC, ...
    number?: string | null;
    atcud?: string | null;
    hash?: string | null;
    amount?: number;
    status?: string;              // N | A | F
    mode?: string;                // tests | normal
    pdf_url?: string | null;
    external_reference?: string | null;
    connected?: boolean;          // ligado a doc já existente (não emitido por nós)
    created_by?: number | null;
}

export class InvoiceModel extends BaseModel {
    static tableName = "invoices";
    static allowedColumns = [
        "id", "order_id", "provider", "external_id", "type", "number", "atcud",
        "amount", "status", "mode", "external_reference", "connected", "created_by",
        "created_at", "updated_at",
    ];
    static allowedRelations = ["order"];

    static async create(data: Record<string, any>, connection?: any): Promise<any> {
        return this.genericCreate(data, connection);
    }

    // Relação: encomenda do documento
    static async order(invoice: any, connection?: any) {
        if (!invoice.order_id) return null;
        const order = await OrderModel.findOneBy("id", invoice.order_id, connection);
        if (order) order.customers = await OrderModel.customers(order, connection);
        return order;
    }

    static async findByOrder(orderId: number, connection?: any): Promise<any[]> {
        return await this.findAllBy("order_id", orderId, connection);
    }

    // Documento ativo (não anulado) mais recente de uma encomenda
    static async activeForOrder(orderId: number, connection?: any): Promise<any | null> {
        const conn = connection || db;
        const [rows]: any = await conn.execute(
            `SELECT * FROM invoices WHERE order_id = ? AND status <> 'A' ORDER BY id DESC LIMIT 1`,
            [orderId]
        );
        return rows[0] || null;
    }
}
