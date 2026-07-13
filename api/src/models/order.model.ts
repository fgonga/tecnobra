// src/models/Order.ts
import {db} from "../db/db";
import {BaseModel} from "./base.model";
import {CouponModel} from "./coupon.model";
import {CourseModel} from "./course.model";
import {OrderCustomerModel} from "./order_customer.model";
import {PaymentModel} from "./payment.model";
import {InvoiceModel} from "./invoice.model";

export interface Order {
    id?: number;
    code: string;
    quantity: number;
    status?: "pending" | "paid" | "completed" | "canceled" | "refunded";
    invoice_id?: number | null;
    amount_due: number;
    discount_promotion: number;
    discount_coupon: number;
    discount_card: number;
    coupon_id: number;
    discount_total: number;
    subtotal: number;
    amount_paid: number;
    pending_at?: string;
    paid_at?: string;
    completed_at?: string;
    canceled_at?: string;
    course_id?: string;
    card_id?: number;
    card_percentage?: number;
    card_name?: string;
}

export class OrderModel  extends  BaseModel{
    static tableName = "orders";
    static allowedColumns = ["id","code","quantity","status","invoice_id","amount_due","discount_promotion","discount_coupon","discount_card","coupon_id","discount_total","subtotal","amount_paid","pending_at","paid_at","completed_at","canceled_at","course_id","card_id","card_percentage","card_name","abandoned_notified_at","created_at","updated_at"];
    static allowedRelations = ["coupon","course","customers","payments","invoice"];

    static async create(data: Record<string, any>, connection?: any): Promise<any> {
        return this.genericCreate(data, connection);
    }

    static async findPending() {
        const [rows] = await db.execute("SELECT * FROM orders WHERE status = 'pending'");
        return rows as any[];
    }

    static async coupon(order: any, connection?: any) {
        if (!order.coupon_id) return null;
        return await CouponModel.findOneBy("id", order.coupon_id, connection);
    }

    // Relação: Curso associado
    static async course(order: any, connection?: any) {
        if (!order.course_id) return null;
        return await CourseModel.findOneBy("id", order.course_id, connection);
    }

    // Relação: Clientes ligados à encomenda
    static async customers(order: any, connection?: any) {
        return await OrderCustomerModel.findAllBy("order_id", order.id, connection);
    }

    // Relação: Clientes ligados à encomenda
    static async payments(order: any, connection?: any) {
        return await PaymentModel.findAllBy("order_id", order.id, connection);
    }

    // Relação: documento fiscal principal da encomenda
    static async invoice(order: any, connection?: any) {
        if (!order.invoice_id) return null;
        return await InvoiceModel.findOneBy("id", order.invoice_id, connection);
    }
    static async findAbandoned(minutes = 5) {
        const [rows] = await db.execute(
            `
  SELECT 
    o.id,
    o.code,
    p.phone
  FROM orders o
  JOIN payments p ON p.id = (
    SELECT p2.id
    FROM payments p2
    WHERE p2.order_id = o.id
    ORDER BY p2.id ASC
    LIMIT 1
  )
  WHERE o.status = 'pending'
    AND o.pending_at <= DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)
    AND o.abandoned_notified_at IS NULL
  `
        );


        return rows as any[];
    }


    /**
     * Cancela encomendas pendentes que já não têm hipótese de pagamento.
     *
     * Regra:
     *  - Pagamento por **referência**: respeita a validade real (`payments.expired_at`,
     *    que guarda a `dueDate` da AppyPay — horas ou dias). A encomenda só é cancelada
     *    quando NÃO existe nenhuma referência ainda válida (`expired_at >= NOW()`).
     *  - **Express/QR/sem pagamento**: mantém a janela de inatividade de `minutes`
     *    desde `pending_at` (instantâneos, validade curta).
     *
     * A janela de `minutes` funciona como piso mínimo para todos; como as referências
     * são sempre de horas/dias, na prática elas só caem na respetiva `dueDate`.
     */
    static async updatePendingOrders(minutes = 60) {
        return await db.execute(
            `
    UPDATE orders o
    SET o.status = 'canceled',
        o.canceled_at = NOW()
    WHERE o.status = 'pending'
      AND o.canceled_at IS NULL
      AND o.pending_at IS NOT NULL
      AND o.pending_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
      AND NOT EXISTS (
          SELECT 1
          FROM payments p
          WHERE p.order_id = o.id
            AND p.payment_type = 'ref'
            AND p.expired_at IS NOT NULL
            AND p.expired_at >= NOW()
            AND (p.status IS NULL OR p.status <> 'failed')
      )
    `,
            [minutes]
        );
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
                    field: 'EXISTS (SELECT 1 FROM order_customers oc WHERE oc.order_id = orders.id AND oc.name LIKE ?)',
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
                { sql: 'EXISTS (SELECT 1 FROM order_customers oc WHERE oc.order_id = orders.id AND oc.name LIKE ?)' },
            ];
        }

        const result = await super.paginate(processedOptions, connection);
        const ids: number[] = (result.data || []).map((r: any) => r.id).filter(Boolean);
        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            const [commRows]: any = await db.query(
                `SELECT o.id, COALESCE(ROUND(o.subtotal * (i.commission / 100.0), 2), 0) AS commission_amount
                 FROM orders o LEFT JOIN influencers i ON i.coupon_id = o.coupon_id
                 WHERE o.id IN (${placeholders})`,
                ids
            );
            const commMap: Record<number, number> = Object.fromEntries(
                (commRows as any[]).map((r: any) => [r.id, Number(r.commission_amount)])
            );

            // Validade da referência: maior expired_at entre os pagamentos 'ref' não falhados
            // da encomenda (a referência ainda válida). Usado para mostrar "Expira" na listagem.
            const [refRows]: any = await db.query(
                `SELECT p.order_id, MAX(p.expired_at) AS reference_expires_at
                 FROM payments p
                 WHERE p.payment_type = 'ref'
                   AND p.expired_at IS NOT NULL
                   AND (p.status IS NULL OR p.status <> 'failed')
                   AND p.order_id IN (${placeholders})
                 GROUP BY p.order_id`,
                ids
            );
            const refMap: Record<number, string> = Object.fromEntries(
                (refRows as any[]).map((r: any) => [r.order_id, r.reference_expires_at])
            );

            result.data = result.data.map((r: any) => ({
                ...r,
                commission_amount: commMap[r.id] ?? 0,
                reference_expires_at: refMap[r.id] ?? null,
            }));
        }
        return result;
    }

    static async markAbandonedNotified(id: number) {
        await db.execute(
            `
    UPDATE orders
    SET abandoned_notified_at = NOW()
    WHERE id = ?
    `,
            [id]
        );
    }
}
