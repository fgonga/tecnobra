import { RefundModel } from "../models/refund.model";
import { BaseCrudService } from "./BaseCrudService";
import { BaseModel } from "../models/base.model";
import { WalletModel } from "../models/wallet.model";
import { eventQueue } from "../queues";
import { Thinkific } from "@bit/thinkificts/Thinkific";
import { InvoiceService } from "./InvoiceService";

export class RefundService extends BaseCrudService<typeof RefundModel> {
  constructor() {
    super(RefundModel);
  }

  async approve(id: number, notes?: string, approvedBy?: string): Promise<boolean> {
    const [refund] = await BaseModel.query<any>(
      `SELECT * FROM refunds WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!refund) throw new Error("Reembolso não encontrado.");
    if (refund.status !== "pending") throw new Error("Reembolso não está em estado pendente.");

    const updated = await RefundModel.approve(id, notes, approvedBy);

    if (updated) {
      if (refund.order_id) {
        await BaseModel.query("UPDATE orders SET status = 'refunded' WHERE id = ?", [refund.order_id]);
      }
      if (refund.payment_id) {
        await BaseModel.query("UPDATE payments SET status = 'refunded' WHERE id = ?", [refund.payment_id]);
      }

      await this.reverseWalletTransactions(refund, id);
      await this.unenrollStudents(refund);
      await this.emitCreditNote(refund, notes);
      await this.fireRefundEventIfPartner(id);
    }

    return updated;
  }

  private async reverseWalletTransactions(refund: any, refundId: number) {
    try {
      if (!refund.payment_id) return;

      // Buscar todas as transações de carteira originadas por este pagamento
      const txns = await BaseModel.query<any>(
        `SELECT type, account, influencer_id, amount
         FROM wallet_transactions
         WHERE reference_type = 'payment' AND reference_id = ?`,
        [refund.payment_id]
      );

      if (!txns?.length) return;

      // 1. Reverter encargo de plataforma: commissions → treesix
      const commissionIn = txns.find((t: any) => t.type === 'transfer_in' && t.account === 'commissions');
      if (commissionIn) {
        await WalletModel.transfer({
          amount: Math.abs(Number(commissionIn.amount)),
          fromAccount: "commissions",
          toAccount: "treesix",
          description: `Estorno encargo plataforma – devolução #${refundId}`,
          referenceType: "refund",
          referenceId: refundId,
        });
      }

      // 2. Reverter comissão de parceiro: partners → treesix
      const partnerIn = txns.find((t: any) => t.type === 'transfer_in' && t.account === 'partners');
      if (partnerIn) {
        await WalletModel.transfer({
          amount: Math.abs(Number(partnerIn.amount)),
          fromAccount: "partners",
          toAccount: "treesix",
          influencer_id: partnerIn.influencer_id,
          description: `Estorno comissão parceiro – devolução #${refundId}`,
          referenceType: "refund",
          referenceId: refundId,
        });
      }

      // 3. Devolver dinheiro ao cliente: treesix → clients
      const originalPaymentIn = txns.find((t: any) => t.type === 'transfer_in' && t.account === 'treesix');
      if (originalPaymentIn) {
        await WalletModel.transfer({
          amount: Number(refund.amount),
          fromAccount: "treesix",
          toAccount: "clients",
          description: `Devolução aprovada: refund #${refundId}`,
          referenceType: "refund",
          referenceId: refundId,
        });
      }
    } catch (err) {
      console.error(`[RefundService] Falha ao reverter carteira para devolução #${refundId}:`, err);
    }
  }

  /** Emite a Nota de Crédito no Vendus para a encomenda devolvida (best-effort). */
  private async emitCreditNote(refund: any, reason?: string) {
    try {
      if (!refund.order_id) return;
      await InvoiceService.emitCreditNoteForOrder(refund.order_id, { reason });
    } catch (err) {
      console.error(`[RefundService] Falha ao emitir nota de crédito – devolução #${refund.id}:`, err);
    }
  }

  private async unenrollStudents(refund: any) {
    try {
      if (!refund.order_id) return;

      const customers = await BaseModel.query<any>(
        `SELECT oc.thinkific_user_id, oc.thinkific_enrollment_id,
                c.thinkific_type, c.thinkific_id
         FROM order_customers oc
         JOIN orders o ON o.id = oc.order_id
         JOIN courses c ON c.id = o.course_id
         WHERE oc.order_id = ? AND oc.thinkific_enrollment_id IS NOT NULL`,
        [refund.order_id]
      );

      for (const customer of customers) {
        const type = (customer.thinkific_type || "course").toLowerCase();
        if (type === "bundle") {
          await Thinkific.unenrollBundle(
            Number(customer.thinkific_id),
            Number(customer.thinkific_user_id)
          );
        } else {
          await Thinkific.unenrollCourse(Number(customer.thinkific_enrollment_id));
        }
      }
    } catch (err) {
      console.error(`[RefundService] Falha ao desmatricular – devolução #${refund.id}:`, err);
    }
  }

  async reject(id: number, notes?: string): Promise<boolean> {
    return await RefundModel.reject(id, notes);
  }

  private async fireRefundEventIfPartner(refundId: number) {
    try {
      const [refund] = await BaseModel.query<any>(
        `SELECT r.order_id, r.payment_id, o.coupon_id
         FROM refunds r
         LEFT JOIN orders o ON o.id = r.order_id
         WHERE r.id = ? LIMIT 1`,
        [refundId]
      );

      if (!refund?.coupon_id) return;

      const [influencer] = await BaseModel.query<any>(
        `SELECT id FROM influencers WHERE coupon_id = ? LIMIT 1`,
        [refund.coupon_id]
      );

      if (!influencer) return;

      await eventQueue.add("payment-refund-event", {
        type: "payment_refund",
        data: {
          refundId,
          paymentId: refund.payment_id ?? null,
          orderId: refund.order_id,
        },
      });
    } catch (err) {
      console.error(`[RefundService] Failed to fire refund event for refund #${refundId}:`, err);
    }
  }
}
