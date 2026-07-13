import { db } from "../db/db";
import type{PaymentWebHook} from "@bit/appypayts/src/types";
import {nowTo} from "../utils/date";
import {BaseModel} from "./base.model";
import {OrderModel} from "./order.model";

export interface Payment {
    code: string;
    order_id: number;
    response?: object;
    amount?: number;
    pending_at?: string;
    failed_at?: string;
    paid_at?: string;
    expired_at?: string;
    phone?: string;
    reference?: string | null;
    is_payed?: boolean;
    status?: "pending" | "failed" | "paid";
    payment_type?: "express"|"qr"|"ref"|"aexpress";

}

export class PaymentModel extends  BaseModel{
    static tableName = "payments";
    static allowedColumns = ["id","code","order_id","amount","pending_at","failed_at","paid_at","expired_at","reminded_at","phone","reference","is_paid","is_payed","status","payment_type","created_at","updated_at"];
    static allowedRelations = ["order"];

    static async order(payment: any, connection?: any) {
        if (!payment.order_id) return null;
        const order = await OrderModel.findOneBy("id", payment.order_id, connection);
        if (order) {
            order.customers = await OrderModel.customers(order, connection);
        }
        return order;
    }

    static async paginate(options: any = {}, connection?: any): Promise<any> {
        const filters: any[] = options.filters || [];
        const { searchable = [], search } = options;
        let processedOptions: any = { ...options };

        // Handle customer_name in filters (advanced filter sidebar)
        const customerFilter = filters.find((f: any) => f.field === 'customer_name');
        if (customerFilter?.value) {
            processedOptions.filters = filters
                .filter((f: any) => f.field !== 'customer_name')
                .concat({
                    field: 'EXISTS (SELECT 1 FROM order_customers oc INNER JOIN orders o ON o.id = oc.order_id WHERE o.id = payments.order_id AND oc.name LIKE ?)',
                    operator: 'RAW',
                    _internal: true,
                    value: `%${customerFilter.value}%`,
                });
        }

        // Handle customer_name in searchable (main search bar)
        if (search && searchable.includes('customer_name')) {
            processedOptions.searchable = searchable.filter((s: string) => s !== 'customer_name');
            processedOptions.searchableRaw = [
                ...(processedOptions.searchableRaw || []),
                { sql: 'EXISTS (SELECT 1 FROM order_customers oc INNER JOIN orders o ON o.id = oc.order_id WHERE o.id = payments.order_id AND oc.name LIKE ?)' },
            ];
        }

        const result = await super.paginate(processedOptions, connection);
        const orderIds: number[] = (result.data || []).map((r: any) => r.order_id).filter(Boolean);
        if (orderIds.length > 0) {
            const placeholders = orderIds.map(() => '?').join(',');
            const [commRows]: any = await db.query(
                `SELECT o.id AS order_id, COALESCE(ROUND(o.subtotal * (i.commission / 100.0), 2), 0) AS commission_amount
                 FROM orders o LEFT JOIN influencers i ON i.coupon_id = o.coupon_id
                 WHERE o.id IN (${placeholders})`,
                orderIds
            );
            const commMap: Record<number, number> = Object.fromEntries(
                (commRows as any[]).map((r: any) => [r.order_id, Number(r.commission_amount)])
            );
            result.data = result.data.map((r: any) => ({ ...r, commission_amount: commMap[r.order_id] ?? 0 }));
        }
        return result;
    }
    static async create(payment: Payment,connection?) {
        const dbConn = connection || db;
        const [result] =   await dbConn.execute(
            `INSERT INTO payments 
       (order_id, response, amount, expired_at, code, phone, payment_type) 
       VALUES (?, ?, ?, ?, ?, ?, ? )`,
            [
                payment.order_id,
                JSON.stringify(payment.response || {}),
                payment.amount,
                payment.expired_at,
                payment.code,
                payment.phone,
                payment.payment_type,

            ]
        );
        return (result as any).insertId;
    }

    static async findPending() {
        const [rows] = await db.execute(
            "SELECT * FROM payments WHERE status = 'pending'"
        );
        return rows as any[];
    }
    static async findOneByCode(code: string): Promise<Payment[]> {
        const [rows] = await db.execute(
            `SELECT * FROM payments WHERE code = ? LIMIT 1`,
            [code]
        );
        return  rows as Payment[];
    }
    // Atualiza status e datas
    static async updateStatus(
        code: string,
        status: "pending" | "paid" | "failed",
        response?: PaymentWebHook,
        connection?
    ) {
        const dbConn = connection || db;

        const fields: string[] = ["status = ?"];
        const values: any[] = [status];

        if (response) {
            fields.push("response = ?");
            values.push(JSON.stringify(response));
        }

        const now = nowTo(0);
        if (status === "paid") {fields.push("paid_at = ?", "is_paid = ?"); values.push(now, 1)}
        if (status === "failed") {fields.push("failed_at = ?");  values.push(now)}
        if (status === "pending") {fields.push("pending_at = ?");  values.push(now)}
        values.push(code);

        const sql = `UPDATE payments SET ${fields.join(", ")} WHERE code = ?`;
        await dbConn.execute(sql, values);
    }
    static async isPaid(code: string): Promise<{ code:string,is_paid:number,paid_at:number }> {
        const [rows] = await db.execute(
            `SELECT code, paid_at, is_paid FROM ${this.tableName} WHERE code = ? LIMIT 1`,
            [code]
        );
        return (rows as { code:string,is_paid:number,paid_at:number }[])[0];
    }

    // Persiste a referência gerada (entidade/nº/validade) no campo response e
    // atualiza a validade do pagamento, sem alterar o status (continua pending).
    static async saveReference(
        code: string,
        response: any,
        expiredAt: string,
        connection?
    ) {
        const dbConn = connection || db;
        // Espelha o número da referência na coluna pesquisável `reference`.
        const referenceNumber = response?.reference?.referenceNumber ?? null;
        await dbConn.execute(
            `UPDATE payments SET response = ?, reference = ?, expired_at = ? WHERE code = ?`,
            [JSON.stringify(response), referenceNumber, expiredAt, code]
        );
    }

    // Marca como falhadas as referências (ref/aref) pendentes cuja validade já passou.
    // Set-based: uma única query, não linha-a-linha. Devolve o nº de linhas afetadas.
    static async expireStaleReferences(connection?): Promise<number> {
        const dbConn = connection || db;
        const [result]: any = await dbConn.execute(
            `UPDATE payments
                SET status = 'failed', failed_at = NOW()
              WHERE payment_type IN ('ref','aref')
                AND status = 'pending'
                AND (is_paid = 0 OR is_paid IS NULL)
                AND expired_at IS NOT NULL
                AND expired_at < NOW()`
        );
        return result?.affectedRows ?? 0;
    }

    // Referências (ref/aref) ainda pendentes que expiram HOJE e ainda não foram
    // lembradas ao cliente. Usado pela task de lembrete no dia da expiração.
    static async findExpiringToday(connection?): Promise<any[]> {
        const dbConn = connection || db;
        const [rows]: any = await dbConn.execute(
            `SELECT code, order_id, phone, reference, expired_at
               FROM payments
              WHERE payment_type IN ('ref','aref')
                AND status = 'pending'
                AND (is_paid = 0 OR is_paid IS NULL)
                AND reminded_at IS NULL
                AND expired_at IS NOT NULL
                AND expired_at >= NOW()
                AND DATE(expired_at) = CURDATE()`
        );
        return rows as any[];
    }

    // Guard anti-duplicado do lembrete de expiração.
    static async markReminded(code: string, connection?): Promise<void> {
        const dbConn = connection || db;
        await dbConn.execute(
            `UPDATE payments SET reminded_at = NOW() WHERE code = ?`,
            [code]
        );
    }

}
