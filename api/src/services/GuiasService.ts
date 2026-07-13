import { db } from "../db/db";
import { BaseCrudService } from "./BaseCrudService";
import { GuiaRemessaModel, IGuiaRemessa } from "../models/guia_remessa.model";
import { UploadService } from "./UploadService";
import { ValidationError } from "../exceptions/ValidationError";

export class GuiasService extends BaseCrudService<typeof GuiaRemessaModel> {
  constructor() {
    super(GuiaRemessaModel);
  }

  /**
   * Cria a guia + itens e incrementa o stock de cada material — tudo na
   * mesma transação, com locks nas linhas de materiais.
   */
  async store(data: IGuiaRemessa & { documento?: string | null; registado_por?: number }): Promise<any> {
    const itens = data.itens ?? [];
    if (!itens.length) {
      throw new ValidationError("A guia de remessa precisa de pelo menos um item.", 422, "danger");
    }

    let documento: string | null = null;
    if (data.documento?.startsWith("data:")) {
      documento = UploadService.saveDataUrl(data.documento, "guias");
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [guia]: any = await conn.execute(
        `INSERT INTO guias_remessa
           (obra_id, numero, fornecedor_empresa_id, fornecedor_nome, data_entrega, recebido_por, documento, obs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.obra_id, data.numero,
          data.fornecedor_empresa_id ?? null, data.fornecedor_nome ?? null,
          data.data_entrega, data.registado_por ?? null,
          documento, data.obs ?? null,
        ]
      );

      for (const item of itens) {
        const [mRows]: any = await conn.execute(
          `SELECT id, obra_id FROM materiais WHERE id = ? FOR UPDATE`,
          [item.material_id]
        );
        const material = mRows[0];
        if (!material) throw new ValidationError(`Material #${item.material_id} não encontrado.`, 422, "danger");
        if (material.obra_id !== data.obra_id) {
          throw new ValidationError(`O material #${item.material_id} pertence a outra obra.`, 422, "danger");
        }
        if (!(Number(item.quantidade) > 0)) {
          throw new ValidationError("As quantidades da guia têm de ser positivas.", 422, "danger");
        }

        await conn.execute(
          `INSERT INTO guias_remessa_itens (guia_id, material_id, quantidade, preco_unitario)
           VALUES (?, ?, ?, ?)`,
          [guia.insertId, item.material_id, item.quantidade, item.preco_unitario ?? null]
        );
        await conn.execute(
          `UPDATE materiais SET stock_atual = stock_atual + ? WHERE id = ?`,
          [item.quantidade, item.material_id]
        );
      }

      await conn.commit();
      return { id: guia.insertId, ...data, documento };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /** Guias não são editáveis nem elimináveis (reverteria stock já usado). */
  async update(): Promise<never> {
    throw new ValidationError("Guias de remessa não são editáveis.", 422, "warning");
  }

  async delete(): Promise<never> {
    throw new ValidationError("Guias de remessa não podem ser eliminadas.", 422, "warning");
  }
}
