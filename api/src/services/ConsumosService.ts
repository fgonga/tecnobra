import { db } from "../db/db";
import { BaseCrudService } from "./BaseCrudService";
import { ConsumoMaterialModel, IConsumoMaterial } from "../models/consumo_material.model";
import { ValidationError } from "../exceptions/ValidationError";
import { AlertService } from "./AlertService";
import { configCache } from "./ConfigCache";

export type ConsumoResult = {
  consumo: any;
  material: { id: number; nome: string; stock_atual: number; stock_minimo: number };
  stock_baixo: boolean;
};

export class ConsumosService extends BaseCrudService<typeof ConsumoMaterialModel> {
  constructor() {
    super(ConsumoMaterialModel);
  }

  /** Regista o consumo e decrementa o stock na mesma transação. */
  async store(data: IConsumoMaterial): Promise<ConsumoResult> {
    if (!(Number(data.quantidade) > 0)) {
      throw new ValidationError("A quantidade tem de ser positiva.", 422, "danger");
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();
    let material: any;
    let consumoId: number;
    try {
      const [mRows]: any = await conn.execute(
        `SELECT * FROM materiais WHERE id = ? FOR UPDATE`,
        [data.material_id]
      );
      material = mRows[0];
      if (!material) throw new ValidationError("Material não encontrado.", 404, "danger");
      if (material.obra_id !== data.obra_id) {
        throw new ValidationError("O material pertence a outra obra.", 422, "danger");
      }
      if (Number(material.stock_atual) < Number(data.quantidade)) {
        throw new ValidationError(
          `Stock insuficiente: existem ${Number(material.stock_atual)} ${material.unidade} disponíveis.`,
          422, "warning"
        );
      }

      const [consumo]: any = await conn.execute(
        `INSERT INTO consumos_materiais (obra_id, material_id, quantidade, trabalhador_id, registado_por, obs)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.obra_id, data.material_id, data.quantidade, data.trabalhador_id ?? null, data.registado_por ?? null, data.obs ?? null]
      );
      consumoId = consumo.insertId;

      await conn.execute(
        `UPDATE materiais SET stock_atual = stock_atual - ? WHERE id = ?`,
        [data.quantidade, data.material_id]
      );

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // Pós-transação: verifica limiar e dispara alerta de stock baixo
    const novoStock = Number(material.stock_atual) - Number(data.quantidade);
    const stockBaixo = novoStock <= Number(material.stock_minimo);
    if (stockBaixo) {
      try {
        const cfg: any = await configCache.get();
        if (cfg?.stock_alerta_ativo) {
          const jaExiste = await AlertService.existsOpen(data.obra_id, "stock_baixo", "material", data.material_id);
          if (!jaExiste) {
            await AlertService.create({
              obra_id: data.obra_id,
              tipo: "stock_baixo",
              referencia_tipo: "material",
              referencia_id: data.material_id,
              mensagem: `Stock baixo: ${material.nome} — ${novoStock} ${material.unidade} (mínimo ${Number(material.stock_minimo)}).`,
            });
            await AlertService.notifySupervisors("LowStockAlert", data.obra_id, { materialId: data.material_id });
          }
        }
      } catch (e) {
        console.error("[ConsumosService] alerta de stock baixo falhou:", e);
      }
    }

    return {
      consumo: { id: consumoId, ...data },
      material: { id: material.id, nome: material.nome, stock_atual: novoStock, stock_minimo: Number(material.stock_minimo) },
      stock_baixo: stockBaixo,
    };
  }
}
