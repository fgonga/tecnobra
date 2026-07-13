import { nanoid } from "nanoid";
import { db } from "../db/db";
import { BaseCrudService } from "./BaseCrudService";
import { EquipamentoModel, IEquipamento } from "../models/equipamento.model";
import { UploadService } from "./UploadService";
import { ValidationError } from "../exceptions/ValidationError";

export class EquipamentosService extends BaseCrudService<typeof EquipamentoModel> {
  constructor() {
    super(EquipamentoModel);
  }

  async store(data: IEquipamento & { foto?: string | null }): Promise<any> {
    const payload: Record<string, any> = { ...data };
    payload.qr_token = nanoid(21);
    if (payload.foto?.startsWith("data:")) {
      payload.foto = UploadService.saveDataUrl(payload.foto, "equipamentos");
    }
    const created = await super.store(payload);
    delete created.qr_token;
    return created;
  }

  async update(id: number, data: Partial<IEquipamento> & { foto?: string | null }): Promise<any> {
    const payload: Record<string, any> = { ...data };
    delete payload.qr_token;
    if (payload.foto?.startsWith("data:")) {
      payload.foto = UploadService.saveDataUrl(payload.foto, "equipamentos");
    }
    return super.update(id, payload);
  }

  /** Levantamento: disponível → em_uso, com responsável. Transacional. */
  static async levantar(
    equipamentoId: number,
    input: { trabalhador_id: number; devolucao_prevista?: string | null; obs?: string | null; registado_por: number }
  ): Promise<any> {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [rows]: any = await conn.execute(
        `SELECT * FROM equipamentos WHERE id = ? FOR UPDATE`,
        [equipamentoId]
      );
      const eq = rows[0];
      if (!eq) throw new ValidationError("Equipamento não encontrado.", 404, "danger");
      if (eq.estado !== "disponivel") {
        throw new ValidationError(`Equipamento não está disponível (estado: ${eq.estado}).`, 422, "warning");
      }

      const [tRows]: any = await conn.execute(
        `SELECT id, nome, estado FROM trabalhadores WHERE id = ?`,
        [input.trabalhador_id]
      );
      const trabalhador = tRows[0];
      if (!trabalhador) throw new ValidationError("Trabalhador não encontrado.", 404, "danger");
      if (trabalhador.estado !== "ativo") {
        throw new ValidationError("O trabalhador não está ativo.", 422, "danger");
      }

      const [mov]: any = await conn.execute(
        `INSERT INTO movimentos_equipamento
           (equipamento_id, obra_id, trabalhador_id, tipo, devolucao_prevista, registado_por, obs)
         VALUES (?, ?, ?, 'levantamento', ?, ?, ?)`,
        [equipamentoId, eq.obra_id, input.trabalhador_id, input.devolucao_prevista ?? null, input.registado_por, input.obs ?? null]
      );
      await conn.execute(
        `UPDATE equipamentos SET estado = 'em_uso', trabalhador_atual_id = ? WHERE id = ?`,
        [input.trabalhador_id, equipamentoId]
      );

      await conn.commit();
      return { movimento_id: mov.insertId, equipamento_id: equipamentoId, obra_id: eq.obra_id, estado: "em_uso", trabalhador };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /** Devolução: em_uso → disponível/danificado/desaparecido. Transacional. */
  static async devolver(
    equipamentoId: number,
    input: { estado_devolucao?: "ok" | "danificado" | "desaparecido"; obs?: string | null; registado_por: number }
  ): Promise<any> {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [rows]: any = await conn.execute(
        `SELECT * FROM equipamentos WHERE id = ? FOR UPDATE`,
        [equipamentoId]
      );
      const eq = rows[0];
      if (!eq) throw new ValidationError("Equipamento não encontrado.", 404, "danger");
      if (eq.estado !== "em_uso") {
        throw new ValidationError("O equipamento não está em uso.", 422, "warning");
      }

      const estadoDevolucao = input.estado_devolucao ?? "ok";
      const novoEstado =
        estadoDevolucao === "danificado" ? "danificado"
        : estadoDevolucao === "desaparecido" ? "desaparecido"
        : "disponivel";

      const [mov]: any = await conn.execute(
        `INSERT INTO movimentos_equipamento
           (equipamento_id, obra_id, trabalhador_id, tipo, estado_devolucao, registado_por, obs)
         VALUES (?, ?, ?, 'devolucao', ?, ?, ?)`,
        [equipamentoId, eq.obra_id, eq.trabalhador_atual_id, estadoDevolucao, input.registado_por, input.obs ?? null]
      );
      await conn.execute(
        `UPDATE equipamentos SET estado = ?, trabalhador_atual_id = NULL WHERE id = ?`,
        [novoEstado, equipamentoId]
      );

      await conn.commit();
      return { movimento_id: mov.insertId, equipamento_id: equipamentoId, obra_id: eq.obra_id, estado: novoEstado, estado_devolucao: estadoDevolucao };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
}
