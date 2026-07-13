import { nanoid } from "nanoid";
import { db } from "../db/db";
import { BaseCrudService } from "./BaseCrudService";
import { MaterialModel, IMaterial } from "../models/material.model";

export class MateriaisService extends BaseCrudService<typeof MaterialModel> {
  constructor() {
    super(MaterialModel);
  }

  async store(data: IMaterial): Promise<any> {
    const payload: Record<string, any> = { ...data, qr_token: nanoid(21) };
    const created = await super.store(payload);
    delete created.qr_token;
    return created;
  }

  async update(id: number, data: Partial<IMaterial>): Promise<any> {
    const payload: Record<string, any> = { ...data };
    delete payload.qr_token;
    // stock_atual só muda via guias/consumos (transacional)
    delete payload.stock_atual;
    return super.update(id, payload);
  }

  /** Painel de stock por obra: atual, mínimo, orçado, entregue, consumido. */
  static async stock(obraId: number): Promise<any[]> {
    const [rows]: any = await db.execute(
      `SELECT m.id, m.nome, m.unidade, m.categoria,
              m.stock_atual, m.stock_minimo,
              COALESCE(o.quantidade_orcada, 0) AS orcado,
              COALESCE(e.entregue, 0) AS entregue,
              COALESCE(c.consumido, 0) AS consumido
       FROM materiais m
       LEFT JOIN orcamentos_materiais o ON o.material_id = m.id AND o.obra_id = m.obra_id
       LEFT JOIN (
         SELECT gi.material_id, SUM(gi.quantidade) AS entregue
         FROM guias_remessa_itens gi
         INNER JOIN guias_remessa g ON g.id = gi.guia_id
         WHERE g.obra_id = ?
         GROUP BY gi.material_id
       ) e ON e.material_id = m.id
       LEFT JOIN (
         SELECT material_id, SUM(quantidade) AS consumido
         FROM consumos_materiais
         WHERE obra_id = ?
         GROUP BY material_id
       ) c ON c.material_id = m.id
       WHERE m.obra_id = ?
       ORDER BY m.nome`,
      [obraId, obraId, obraId]
    );
    return rows.map((r: any) => ({
      ...r,
      stock_atual: Number(r.stock_atual),
      stock_minimo: Number(r.stock_minimo),
      orcado: Number(r.orcado),
      entregue: Number(r.entregue),
      consumido: Number(r.consumido),
      abaixo_minimo: Number(r.stock_atual) <= Number(r.stock_minimo),
    }));
  }
}
