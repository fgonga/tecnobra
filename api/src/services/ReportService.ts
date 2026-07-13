/*
 *  Tecnobra — Relatórios (SQL agregado, estilo filters[]/params[]).
 *
 *  Todos os endpoints aceitam ?start=YYYY-MM-DD&end=YYYY-MM-DD e filtros
 *  opcionais por obra/empresa/trabalhador. Exportação PDF/Excel é feita
 *  no frontend (xlsx + jsPDF).
 */

import { db } from "../db/db";

type Range = { start?: string; end?: string; obra_id?: string | number };

function baseFilters(query: Range, dateColumn: string, alias = "") {
  const filters: string[] = [];
  const params: any[] = [];
  const col = alias ? `${alias}.` : "";
  if (query.start) {
    filters.push(`${col}${dateColumn} >= ?`);
    params.push(`${query.start} 00:00:00`);
  }
  if (query.end) {
    filters.push(`${col}${dateColumn} <= ?`);
    params.push(`${query.end} 23:59:59`);
  }
  if (query.obra_id) {
    filters.push(`${col}obra_id = ?`);
    params.push(Number(query.obra_id));
  }
  return { filters, params };
}

export class ReportService {
  /** Presenças: dias presentes, primeira entrada, última saída por trabalhador. */
  static async presencas(query: Range & { empresa_id?: string; trabalhador_id?: string }) {
    const { filters, params } = baseFilters(query, "ocorrido_em", "m");
    filters.push(`m.tipo_entidade = 'trabalhador'`);
    if (query.empresa_id) {
      filters.push(`t.empresa_id = ?`);
      params.push(Number(query.empresa_id));
    }
    if (query.trabalhador_id) {
      filters.push(`m.trabalhador_id = ?`);
      params.push(Number(query.trabalhador_id));
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows]: any = await db.execute(
      `SELECT t.id, t.nome, t.funcao, e.nome AS empresa,
              COUNT(DISTINCT DATE(m.ocorrido_em)) AS dias_presentes,
              SUM(m.direcao = 'entrada') AS entradas,
              SUM(m.direcao = 'saida') AS saidas,
              MIN(TIME(m.ocorrido_em)) AS primeira_entrada,
              MAX(TIME(m.ocorrido_em)) AS ultima_saida
       FROM movimentos m
       INNER JOIN trabalhadores t ON t.id = m.trabalhador_id
       LEFT JOIN empresas e ON e.id = t.empresa_id
       ${where}
       GROUP BY t.id, t.nome, t.funcao, e.nome
       ORDER BY dias_presentes DESC, t.nome`,
      params
    );

    // Presenças por dia (para gráfico)
    const [porDia]: any = await db.execute(
      `SELECT DATE(m.ocorrido_em) AS dia, COUNT(DISTINCT m.trabalhador_id) AS trabalhadores
       FROM movimentos m
       INNER JOIN trabalhadores t ON t.id = m.trabalhador_id
       ${where} ${where ? "AND" : "WHERE"} m.direcao = 'entrada'
       GROUP BY DATE(m.ocorrido_em) ORDER BY dia`,
      params
    );

    return { linhas: rows, por_dia: porDia };
  }

  /** Visitantes no período, com totais por motivo. */
  static async visitantes(query: Range & { motivo?: string }) {
    const { filters, params } = baseFilters(query, "ocorrido_em", "m");
    filters.push(`m.tipo_entidade = 'visitante'`);
    if (query.motivo) {
      filters.push(`v.motivo LIKE ?`);
      params.push(`%${query.motivo}%`);
    }
    const where = `WHERE ${filters.join(" AND ")}`;

    const [rows]: any = await db.execute(
      `SELECT v.id, v.nome, v.empresa, v.motivo, v.anfitriao,
              SUM(m.direcao = 'entrada') AS entradas,
              MIN(m.ocorrido_em) AS primeira_visita,
              MAX(m.ocorrido_em) AS ultima_visita
       FROM movimentos m
       INNER JOIN visitantes v ON v.id = m.visitante_id
       ${where}
       GROUP BY v.id, v.nome, v.empresa, v.motivo, v.anfitriao
       ORDER BY entradas DESC`,
      params
    );

    const [porMotivo]: any = await db.execute(
      `SELECT COALESCE(v.motivo, 'Sem motivo') AS motivo, COUNT(DISTINCT v.id) AS visitantes
       FROM movimentos m
       INNER JOIN visitantes v ON v.id = m.visitante_id
       ${where}
       GROUP BY v.motivo ORDER BY visitantes DESC`,
      params
    );

    return { linhas: rows, por_motivo: porMotivo };
  }

  /** Inventário: estados dos equipamentos + registo de danos/desaparecimentos. */
  static async inventario(query: Range) {
    const obraFilter = query.obra_id ? "WHERE obra_id = ?" : "";
    const obraParams = query.obra_id ? [Number(query.obra_id)] : [];

    const [estados]: any = await db.execute(
      `SELECT estado, COUNT(*) AS total FROM equipamentos ${obraFilter} GROUP BY estado`,
      obraParams
    );

    const [emUso]: any = await db.execute(
      `SELECT eq.id, eq.nome, eq.codigo, eq.categoria, t.nome AS responsavel,
              (SELECT MAX(me.ocorrido_em) FROM movimentos_equipamento me
                WHERE me.equipamento_id = eq.id AND me.tipo = 'levantamento') AS levantado_em
       FROM equipamentos eq
       LEFT JOIN trabalhadores t ON t.id = eq.trabalhador_atual_id
       ${obraFilter ? obraFilter + " AND" : "WHERE"} eq.estado = 'em_uso'
       ORDER BY levantado_em`,
      obraParams
    );

    // Danos/desaparecimentos no período (do histórico de devoluções)
    const { filters, params } = baseFilters(query, "ocorrido_em", "me");
    filters.push(`me.estado_devolucao IN ('danificado', 'desaparecido')`);
    const where = `WHERE ${filters.join(" AND ")}`;
    const [danos]: any = await db.execute(
      `SELECT eq.nome, eq.codigo, me.estado_devolucao, me.ocorrido_em, me.obs,
              t.nome AS responsavel
       FROM movimentos_equipamento me
       INNER JOIN equipamentos eq ON eq.id = me.equipamento_id
       LEFT JOIN trabalhadores t ON t.id = me.trabalhador_id
       ${where}
       ORDER BY me.ocorrido_em DESC`,
      params
    );

    return { estados, em_uso: emUso, danos };
  }

  /** Materiais: orçado vs entregue vs consumido vs stock, com % de desvio. */
  static async materiais(query: Range) {
    const obraFilter = query.obra_id ? "AND g.obra_id = ?" : "";
    const consFilter = query.obra_id ? "AND c.obra_id = ?" : "";
    const matFilter = query.obra_id ? "WHERE m.obra_id = ?" : "";

    const dateG: string[] = [];
    const dateC: string[] = [];
    const paramsG: any[] = [];
    const paramsC: any[] = [];
    if (query.start) {
      dateG.push("g.data_entrega >= ?"); paramsG.push(`${query.start} 00:00:00`);
      dateC.push("c.ocorrido_em >= ?"); paramsC.push(`${query.start} 00:00:00`);
    }
    if (query.end) {
      dateG.push("g.data_entrega <= ?"); paramsG.push(`${query.end} 23:59:59`);
      dateC.push("c.ocorrido_em <= ?"); paramsC.push(`${query.end} 23:59:59`);
    }
    const whereG = dateG.length ? `WHERE ${dateG.join(" AND ")} ${obraFilter}` : (query.obra_id ? `WHERE g.obra_id = ?` : "");
    const whereC = dateC.length ? `WHERE ${dateC.join(" AND ")} ${consFilter}` : (query.obra_id ? `WHERE c.obra_id = ?` : "");
    if (query.obra_id) { paramsG.push(Number(query.obra_id)); paramsC.push(Number(query.obra_id)); }

    const params = [...paramsG, ...paramsC, ...(query.obra_id ? [Number(query.obra_id)] : [])];

    const [rows]: any = await db.execute(
      `SELECT m.id, m.nome, m.unidade, m.categoria,
              m.stock_atual, m.stock_minimo,
              COALESCE(o.quantidade_orcada, 0) AS orcado,
              COALESCE(ent.entregue, 0) AS entregue,
              COALESCE(cons.consumido, 0) AS consumido
       FROM materiais m
       LEFT JOIN orcamentos_materiais o ON o.material_id = m.id AND o.obra_id = m.obra_id
       LEFT JOIN (
         SELECT gi.material_id, SUM(gi.quantidade) AS entregue
         FROM guias_remessa_itens gi
         INNER JOIN guias_remessa g ON g.id = gi.guia_id
         ${whereG}
         GROUP BY gi.material_id
       ) ent ON ent.material_id = m.id
       LEFT JOIN (
         SELECT c.material_id, SUM(c.quantidade) AS consumido
         FROM consumos_materiais c
         ${whereC}
         GROUP BY c.material_id
       ) cons ON cons.material_id = m.id
       ${matFilter}
       ORDER BY m.nome`,
      params
    );

    return {
      linhas: rows.map((r: any) => {
        const orcado = Number(r.orcado);
        const consumido = Number(r.consumido);
        return {
          ...r,
          stock_atual: Number(r.stock_atual),
          stock_minimo: Number(r.stock_minimo),
          orcado,
          entregue: Number(r.entregue),
          consumido,
          desvio_pct: orcado > 0 ? Number((((consumido - orcado) / orcado) * 100).toFixed(1)) : null,
        };
      }),
    };
  }

  /** Desempenho: total e média/dia por trabalhador e métrica. */
  static async desempenho(query: Range & { metrica_id?: string; trabalhador_id?: string }) {
    const filters: string[] = [];
    const params: any[] = [];
    if (query.start) { filters.push(`d.data >= ?`); params.push(query.start); }
    if (query.end) { filters.push(`d.data <= ?`); params.push(query.end); }
    if (query.obra_id) { filters.push(`d.obra_id = ?`); params.push(Number(query.obra_id)); }
    if (query.metrica_id) { filters.push(`d.metrica_id = ?`); params.push(Number(query.metrica_id)); }
    if (query.trabalhador_id) { filters.push(`d.trabalhador_id = ?`); params.push(Number(query.trabalhador_id)); }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows]: any = await db.execute(
      `SELECT t.id AS trabalhador_id, t.nome, t.funcao,
              mt.id AS metrica_id, mt.nome AS metrica, mt.unidade,
              SUM(d.quantidade) AS total,
              COUNT(DISTINCT d.data) AS dias,
              ROUND(SUM(d.quantidade) / COUNT(DISTINCT d.data), 2) AS media_dia
       FROM desempenhos d
       INNER JOIN trabalhadores t ON t.id = d.trabalhador_id
       INNER JOIN metricas_desempenho mt ON mt.id = d.metrica_id
       ${where}
       GROUP BY t.id, t.nome, t.funcao, mt.id, mt.nome, mt.unidade
       ORDER BY mt.nome, total DESC`,
      params
    );

    return { linhas: rows };
  }
}
