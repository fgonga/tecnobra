import { db } from "../db/db";

// Contas do sistema:
//   clients     — agregado de todos os clientes (dinheiro que entra/sai do sistema)
//   treesix     — saldo disponível da plataforma
//   commissions — commissions de plataforma acumulados
//   partners    — comissões de parceiros/influenciadores
//   settled     — montantes já liquidados (repasses pagos)

export type WalletAccount = "clients" | "treesix" | "partners" | "commissions" | "settled";

export class WalletModel {

  /**
   * Lê o saldo actual de uma conta específica.
   */
  private static async accountBalance(account: WalletAccount, conn: any): Promise<number> {
    const [[row]]: any = await conn.execute(
      `SELECT balance FROM wallet_accounts WHERE name = ?`,
      [account]
    );
    return parseFloat(row?.balance ?? 0);
  }

  /**
   * Regista uma transferência entre duas contas (dupla entrada).
   * Cada linha de wallet_transactions armazena o saldo da SUA própria conta após o movimento.
   *
   * Também mantém wallet.balance/total_in/etc. para os KPI cards.
   *   fromAccount === 'clients'  → dinheiro ENTRA no sistema  (wallet.balance +, total_in +)
   *   toAccount   === 'clients'  → devolução                  (wallet.balance -, total_refunds_out +)
   *   toAccount   === 'settled'  → repasse pago               (wallet.balance -, total_settlements_out +)
   */
  static async transfer(
    params: {
      amount: number;
      fromAccount: WalletAccount;
      toAccount: WalletAccount;
      influencer_id?: number | null;
      description: string;
      referenceType?: string | null;
      referenceId?: number | null;
    },
    connection?: any
  ): Promise<void> {
    const conn = connection || db;

    // 1. Actualizar saldo da conta de origem
    await conn.execute(
      `UPDATE wallet_accounts SET balance = balance - ? WHERE name = ?`,
      [params.amount, params.fromAccount]
    );
    const fromBalance = await this.accountBalance(params.fromAccount, conn);

    // 2. Actualizar saldo da conta de destino
    await conn.execute(
      `UPDATE wallet_accounts SET balance = balance + ? WHERE name = ?`,
      [params.amount, params.toAccount]
    );
    const toBalance = await this.accountBalance(params.toAccount, conn);

    // 3. Actualizar wallet global (para KPI cards)
    if (params.fromAccount === "clients") {
      await conn.execute(
        `UPDATE wallet SET balance = balance + ?, total_in = total_in + ?, updated_at = NOW() WHERE id = 1`,
        [params.amount, params.amount]
      );
    } else if (params.toAccount === "clients") {
      await conn.execute(
        `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, total_refunds_out = total_refunds_out + ?, updated_at = NOW() WHERE id = 1`,
        [params.amount, params.amount, params.amount]
      );
    } else if (params.toAccount === "settled") {
      await conn.execute(
        `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, total_settlements_out = total_settlements_out + ?, updated_at = NOW() WHERE id = 1`,
        [params.amount, params.amount, params.amount]
      );
    }

    // 4. Saída da conta de origem — balance_after = saldo da conta de ORIGEM
    await conn.execute(
      `INSERT INTO wallet_transactions
         (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "transfer_out",
        params.fromAccount,
        params.influencer_id ?? null,
        params.referenceType ?? null,
        params.referenceId ?? null,
        -params.amount,
        fromBalance,
        params.description,
      ]
    );

    // 5. Entrada na conta de destino — balance_after = saldo da conta de DESTINO
    await conn.execute(
      `INSERT INTO wallet_transactions
         (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "transfer_in",
        params.toAccount,
        params.influencer_id ?? null,
        params.referenceType ?? null,
        params.referenceId ?? null,
        params.amount,
        toBalance,
        params.description,
      ]
    );
  }

  static async manual(
    params: {
      amount: number;
      type: "manual_in" | "manual_out";
      account: string;
      description: string;
    },
    connection?: any
  ): Promise<void> {
    const conn = connection || db;
    const delta = params.type === "manual_in" ? params.amount : -params.amount;

    await conn.execute(
      `UPDATE wallet_accounts SET balance = balance + ? WHERE name = ?`,
      [delta, params.account]
    );
    const [[accRow]]: any = await conn.execute(
      `SELECT balance FROM wallet_accounts WHERE name = ?`,
      [params.account]
    );
    const accountBalance = parseFloat(accRow?.balance ?? 0);

    // Actualizar wallet global também
    if (params.type === "manual_in") {
      await conn.execute(
        `UPDATE wallet SET balance = balance + ?, total_in = total_in + ?, updated_at = NOW() WHERE id = 1`,
        [params.amount, params.amount]
      );
    } else {
      await conn.execute(
        `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, updated_at = NOW() WHERE id = 1`,
        [params.amount, params.amount]
      );
    }

    await conn.execute(
      `INSERT INTO wallet_transactions
         (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [params.type, params.account, null, null, null, delta, accountBalance, params.description]
    );
  }

  /**
   * Retorna os saldos de todas as contas + totais globais.
   */
  static async get(connection?: any): Promise<{
    balance: number;
    total_in: number;
    total_out: number;
    total_settlements_out: number;
    total_refunds_out: number;
    accounts: Record<WalletAccount, number>;
  } | null> {
    const conn = connection || db;
    const [[walletRow]]: any = await conn.execute(
      `SELECT balance, total_in, total_out, total_settlements_out, total_refunds_out FROM wallet WHERE id = 1`
    );
    if (!walletRow) return null;

    const [accountRows]: any = await conn.execute(
      `SELECT name, balance FROM wallet_accounts`
    );
    const accounts: any = { clients: 0, treesix: 0, partners: 0, commissions: 0, settled: 0 };
    for (const row of accountRows) {
      accounts[row.name] = parseFloat(row.balance);
    }

    return {
      balance: parseFloat(walletRow.balance),
      total_in: parseFloat(walletRow.total_in),
      total_out: parseFloat(walletRow.total_out),
      total_settlements_out: parseFloat(walletRow.total_settlements_out),
      total_refunds_out: parseFloat(walletRow.total_refunds_out),
      accounts,
    };
  }
}
