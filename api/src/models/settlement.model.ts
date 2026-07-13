import { BaseModel } from "./base.model";
import { WalletModel } from "./wallet.model";
import { ValidationError } from "../exceptions/ValidationError";

export class SettlementModel extends BaseModel {
  static tableName = "settlements";
  static allowedColumns = ["id","influencer_id","amount","status","type","paid_at","reference","proof_urls","notes","created_at","updated_at"];
  static allowedRelations = ["influencer"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  static async influencer(settlement: any, connection?: any) {
    if (!settlement.influencer_id) return null;
    const { InfluencerModel } = await import("./influencer.model");
    return await InfluencerModel.findOneBy("id", settlement.influencer_id, connection);
  }

  static async markAsPaid(
    id: number | string,
    { reference, proof_urls, notes }: { reference?: string; proof_urls?: string[]; notes?: string },
    connection?: any
  ): Promise<any> {
    const settlement = await this.findOneById({ id }, connection);
    if (!settlement) throw new ValidationError("Repasse não encontrado.", 404, "Danger");
    if (settlement.status === "paid") throw new ValidationError("Este repasse já foi marcado como pago.", 409, "Warning");
    await this.update(
      id,
      {
        status: "paid",
        paid_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        reference: reference ?? null,
        proof_urls: proof_urls?.length ? JSON.stringify(proof_urls) : null,
        notes: notes ?? null,
      },
      connection
    );

    // Repasse pago: conta de origem → settled
    const fromAccount = settlement.type === "general" ? "treesix" : "partners";
    await WalletModel.transfer(
      {
        amount: parseFloat(settlement.amount),
        fromAccount,
        toAccount: "settled",
        referenceType: "settlement",
        referenceId: Number(id),
        description: `Repasse pago: settlement #${id}`,
        influencer_id: settlement.type === "influencer" ? (settlement.influencer_id ?? null) : null,
      },
      connection
    );

    // Para repasses gerais: também liquidar os encargos acumulados na conta commissions
    if (settlement.type === "general") {
      const totalFees = parseFloat(settlement.total_fees ?? 0);
      if (totalFees > 0) {
        await WalletModel.transfer(
          {
            amount: totalFees,
            fromAccount: "commissions",
            toAccount: "settled",
            referenceType: "settlement",
            referenceId: Number(id),
            description: `Encargos plataforma liquidados: settlement #${id}`,
          },
          connection
        );
      }
    }

    return this.findOneById({ id });
  }

  static async addProof(id: number | string, filePath: string, connection?: any): Promise<any> {
    const settlement = await this.findOneById({ id }, connection);
    if (!settlement) throw new ValidationError("Repasse não encontrado.", 404, "Danger");
    const current: string[] = Array.isArray(settlement.proof_urls)
      ? settlement.proof_urls
      : (settlement.proof_urls ? JSON.parse(settlement.proof_urls) : []);
    current.push(filePath);
    await this.update(id, { proof_urls: JSON.stringify(current) }, connection);
    return this.findOneById({ id });
  }

  static async removeProof(id: number | string, filename: string, connection?: any): Promise<any> {
    const settlement = await this.findOneById({ id }, connection);
    if (!settlement) throw new ValidationError("Repasse não encontrado.", 404, "Danger");
    const current: string[] = Array.isArray(settlement.proof_urls)
      ? settlement.proof_urls
      : (settlement.proof_urls ? JSON.parse(settlement.proof_urls) : []);
    const updated = current.filter(p => !p.endsWith(`/${filename}`));
    await this.update(id, { proof_urls: updated.length ? JSON.stringify(updated) : null }, connection);
    return this.findOneById({ id });
  }
}
