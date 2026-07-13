/*
 *  Tecnobra — Ocupação atual de uma obra: quem está dentro é quem tem o
 *  último movimento com direcao = 'entrada'.
 */

import { db } from "../db/db";

export class PresencaService {
  /** Lista de quem está atualmente dentro da obra + contagens. */
  static async ocupacao(obraId: number) {
    const [rows]: any = await db.execute(
      `SELECT m.tipo_entidade, m.direcao, m.ocorrido_em, m.portao,
              t.id AS trabalhador_id, t.nome AS trabalhador_nome, t.funcao, t.foto,
              e.nome AS empresa_nome,
              v.id AS visitante_id, v.nome AS visitante_nome, v.motivo,
              vc.id AS veiculo_id, vc.matricula
       FROM movimentos m
       INNER JOIN (
         SELECT MAX(id) AS max_id
         FROM movimentos
         WHERE obra_id = ?
         GROUP BY tipo_entidade, COALESCE(trabalhador_id, 0), COALESCE(visitante_id, 0), COALESCE(veiculo_id, 0)
       ) ult ON ult.max_id = m.id
       LEFT JOIN trabalhadores t ON t.id = m.trabalhador_id
       LEFT JOIN empresas e ON e.id = t.empresa_id
       LEFT JOIN visitantes v ON v.id = m.visitante_id
       LEFT JOIN veiculos vc ON vc.id = m.veiculo_id
       WHERE m.direcao = 'entrada'
       ORDER BY m.ocorrido_em DESC`,
      [obraId]
    );

    const dentro = rows.map((r: any) => ({
      tipo: r.tipo_entidade,
      id: r.trabalhador_id ?? r.visitante_id ?? r.veiculo_id,
      nome: r.trabalhador_nome ?? r.visitante_nome ?? r.matricula,
      detalhe: r.funcao ?? r.motivo ?? null,
      empresa: r.empresa_nome ?? null,
      foto: r.foto ?? null,
      desde: r.ocorrido_em,
      portao: r.portao,
    }));

    return {
      total: dentro.length,
      trabalhadores: dentro.filter((d: any) => d.tipo === "trabalhador").length,
      visitantes: dentro.filter((d: any) => d.tipo === "visitante").length,
      veiculos: dentro.filter((d: any) => d.tipo === "veiculo").length,
      dentro,
    };
  }
}
