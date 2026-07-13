import { PaymentWebHook } from "@bit/appypayts/src/types";
import { db } from "../db/db";
/*import { io as Client } from "socket.io-client";*/
import { PaymentModel } from "../models/payment.model";
import { WalletModel } from "../models/wallet.model";
import { enrolmentQueue, notificationQueue, eventQueue, walletQueue } from "../queues";

import axios from "axios";
import { config } from "../config/env";
import io from "../../socket-server";
import AppyPayWebHookMessage from "../utils/AppyPayMessage";
import {nowTo} from "../utils/date";

/*const socket = Client(`${process.env.SOCKET_CLIENT}`);*/

export class PaymentService {
  static async process(payment: PaymentWebHook): Promise<{ success: boolean; action: 'paid' | 'failed' | 'noop' | 'anomaly_paid_but_failed' }> {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
      const [existingRows]: any = await connection.execute(
        `SELECT status, is_paid FROM payments WHERE code = ? LIMIT 1`,
        [payment.merchantTransactionId]
      );
      const current = existingRows?.[0] as { status: string; is_paid: number } | undefined;

      let action: 'paid' | 'failed' | 'noop' | 'anomaly_paid_but_failed' = 'noop';
      if (payment.responseStatus.code === 100) {
        if (current?.is_paid === 1) {
          // já pago — webhook duplicado ou reconciliação aplicada antes
        } else {
          await this.handleSuccess(payment, connection);
          action = 'paid';
        }
      } else {
        if (current?.is_paid === 1) {
          // ANOMALIA: estava pago aqui mas appy diz falhado.
          // Reversão financeira é feita explicitamente via RefundService —
          // aqui apenas registamos a anomalia.
          console.error(`[PaymentService] Anomalia: webhook 'failed' para pagamento já pago: ${payment.merchantTransactionId}`);
          action = 'anomaly_paid_but_failed';
        } else if (current?.status === 'failed') {
          // já falhado — webhook duplicado
        } else {
          await this.handleFailure(payment, connection);
          action = 'failed';
        }
      }

      await connection.commit();
      return { success: true, action };
    } catch (err) {
      await this.handleUnknownError(payment);
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  private static async handleSuccess(payment: PaymentWebHook, connection: any) {
    // 1. CRÍTICO: marcar pagamento como pago (dentro da transacção DB)
    await PaymentModel.updateStatus(payment.merchantTransactionId, "paid", payment, connection);

    // 1.1. Encomenda passa a "paid" (Paga) assim que o pagamento confirma.
    // A matrícula (Thinkific) corre noutro local — worker-enrolment —, e é o
    // EnrolmentService que promove "paid" -> "completed" DEPOIS da matrícula.
    // Assim, se a matrícula falhar (ex.: 401 Thinkific), a encomenda fica
    // corretamente em "paid" (paga, mas não finalizada) em vez de presa em
    // "pending". Fluxo: pending -> paid -> completed.
    await connection.execute(
      `UPDATE orders o
         JOIN payments p ON p.order_id = o.id
          SET o.status = 'paid', o.paid_at = ?
        WHERE p.code = ? AND o.status = 'pending'`,
      [nowTo(0), payment.merchantTransactionId]
    );

    // 2. Notificar checkout imediatamente — cliente vê confirmação sem esperar wallet
    const successResult = AppyPayWebHookMessage(payment);
    this.notifyClient(payment.merchantTransactionId, true, successResult.message, successResult.retryable);

    // 3. Delegar o resto para workers assíncronos (escritas Redis ~1ms)
    await Promise.all([
      walletQueue.add("wallet-payment", { paymentCode: payment.merchantTransactionId }, {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
      }),
      enrolmentQueue.add("enrolment", { paymentId: payment.merchantTransactionId }),
      // Notificações por evento → templates configuráveis (NotificationService)
      notificationQueue.add("notification", { notify: "PaymentReceived", context: { paymentCode: payment.merchantTransactionId } }),
      notificationQueue.add("notification", { notify: "EnrolmentCompleted", context: { paymentCode: payment.merchantTransactionId } }),
    ]);
  }

  // Processado pelo worker-wallet — operações de carteira desacopladas do fluxo crítico
  static async processWallet(paymentCode: string): Promise<void> {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
      const [paymentRow] = await PaymentModel.query<any>(
        `SELECT p.id, p.amount, o.coupon_id, o.subtotal
         FROM payments p
         LEFT JOIN orders o ON o.id = p.order_id
         WHERE p.code = ? LIMIT 1`,
        [paymentCode],
        connection
      );



      if (!paymentRow) throw new Error(`Pagamento não encontrado: ${paymentCode}`);

      // Pagamento recebido: clients → treesix
      await WalletModel.transfer(
        {
          amount: parseFloat(paymentRow.amount),
          fromAccount: "clients",
          toAccount: "treesix",
          referenceType: "payment",
          referenceId: paymentRow.id,
          description: `Pagamento recebido: ${paymentCode}`,
        },
        connection
      );

      // Encargo de plataforma → conta comissões
      const [configRow] = await PaymentModel.query<any>(
        `SELECT platform_fee_rate FROM parametrization WHERE id = 1 LIMIT 1`,
        [],
        connection
      );
      const feeRate = parseFloat(configRow?.platform_fee_rate ?? 0.02);
      const platformFee = parseFloat((parseFloat(paymentRow.amount) * feeRate).toFixed(2));
      if (platformFee > 0) {
        await WalletModel.transfer(
          {
            amount: platformFee,
            fromAccount: "treesix",
            toAccount: "commissions",
            description: `Encargo plataforma ${(feeRate * 100).toFixed(2)}% — ${paymentCode}`,
            referenceType: "payment",
            referenceId: paymentRow.id,
          },
          connection
        );
      }

      // Comissão do influencer → conta parceiros (se aplicável)
      if (paymentRow.coupon_id) {
        const [influencer] = await PaymentModel.query<any>(
          `SELECT id, commission FROM influencers WHERE coupon_id = ? LIMIT 1`,
          [paymentRow.coupon_id],
          connection
        );
        if (influencer) {
          const commission = parseFloat((parseFloat(paymentRow.subtotal) * (influencer.commission / 100)).toFixed(2));
          await WalletModel.transfer(
            {
              amount: commission,
              fromAccount: "treesix",
              toAccount: "partners",
              influencer_id: influencer.id,
              description: `Comissão ${influencer.commission}% — ${paymentCode}`,
              referenceType: "payment",
              referenceId: paymentRow.id,
            },
            connection
          );

          await eventQueue.add("payment-success-event", {
            type: "payment_success",
            data: { paymentId: paymentCode },
          });
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  private static async handleFailure(payment: PaymentWebHook, connection: any) {
    await PaymentModel.updateStatus(payment.merchantTransactionId, "failed", payment, connection);
    const result = AppyPayWebHookMessage(payment);
    this.notifyClient(payment.merchantTransactionId, false, result.message, result.retryable)
  }

  private static async notifyClient(paymentCode: string, success: boolean, message: string, retryable = true) {
    console.log(nowTo(0));
    return axios.post(`http://127.0.0.1:${config.server.port}/snotify`,
        {
          paymentId: paymentCode,
          message: message,
          success: success,
          retryable: retryable,
          updated_at:nowTo(0)
        }
    )
  }

  private static async handleUnknownError(payment: PaymentWebHook) {
    /* socket.emit("payment_failed", {
       room: `payment:${payment.merchantTransactionId}`,
       paymentId: payment.merchantTransactionId,
       message: `Erro desconhecido, entre em contacto com o suporte técnico: ${payment.merchantTransactionId} | ${payment.id}`,
       success: false,
     });*/
  }
}
