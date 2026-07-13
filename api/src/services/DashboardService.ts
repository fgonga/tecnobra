/*
 *  Tecnobra — KPIs do painel executivo (por obra ou globais).
 *  Estilo: filtros[] + params[] com agregações SQL, como o antigo ReportService.
 */

import { db } from "../db/db";
import { PresencaService } from "./PresencaService";

export class DashboardService {
  static async dashboard(query: { obra_id?: number | string }) {
    const obraId = query.obra_id ? Number(query.obra_id) : null;
    const obraFilter = obraId ? "AND obra_id = ?" : "";
    const obraParams = obraId ? [obraId] : [];

    // ─── Entradas/saídas de hoje ───
    const [movHoje]: any = await db.execute(
      `SELECT
         SUM(direcao = 'entrada') AS entradas,
         SUM(direcao = 'saida') AS saidas,
         SUM(direcao = 'entrada' AND tipo_entidade = 'visitante') AS visitantes,
         SUM(direcao = 'entrada' AND tipo_entidade = 'veiculo') AS veiculos
       FROM movimentos
       WHERE DATE(ocorrido_em) = CURDATE() ${obraFilter}`,
      obraParams
    );

    // ─── Equipamentos ───
    const [equip]: any = await db.execute(
      `SELECT
         SUM(estado = 'em_uso') AS em_uso,
         SUM(estado = 'disponivel') AS disponiveis,
         SUM(estado IN ('danificado', 'fora_servico')) AS danificados,
         SUM(estado = 'desaparecido') AS desaparecidos
       FROM equipamentos WHERE 1=1 ${obraFilter}`,
      obraParams
    );

    // ─── Stock baixo ───
    const [stock]: any = await db.execute(
      `SELECT COUNT(*) AS baixo
       FROM materiais WHERE stock_atual <= stock_minimo ${obraFilter}`,
      obraParams
    );

    // ─── Alertas abertos ───
    const [alertas]: any = await db.execute(
      `SELECT COUNT(*) AS abertos FROM alertas WHERE estado = 'aberto' ${obraFilter}`,
      obraParams
    );

    // ─── Presentes agora ───
    let presentes: any = { total: 0, trabalhadores: 0, visitantes: 0, veiculos: 0, dentro: [] };
    if (obraId) {
      presentes = await PresencaService.ocupacao(obraId);
    } else {
      const [obras]: any = await db.execute(`SELECT id FROM obras WHERE estado = 'ativa'`);
      for (const o of obras) {
        const p = await PresencaService.ocupacao(o.id);
        presentes.total += p.total;
        presentes.trabalhadores += p.trabalhadores;
        presentes.visitantes += p.visitantes;
        presentes.veiculos += p.veiculos;
      }
    }

    // ─── Séries: entradas por hora (hoje) ───
    const [porHora]: any = await db.execute(
      `SELECT HOUR(ocorrido_em) AS hora,
              SUM(direcao = 'entrada') AS entradas,
              SUM(direcao = 'saida') AS saidas
       FROM movimentos
       WHERE DATE(ocorrido_em) = CURDATE() ${obraFilter}
       GROUP BY HOUR(ocorrido_em)
       ORDER BY hora`,
      obraParams
    );

    // ─── Séries: presenças (entradas únicas de trabalhadores) últimos 14 dias ───
    const [porDia]: any = await db.execute(
      `SELECT DATE(ocorrido_em) AS dia,
              COUNT(DISTINCT trabalhador_id) AS trabalhadores
       FROM movimentos
       WHERE tipo_entidade = 'trabalhador'
         AND direcao = 'entrada'
         AND ocorrido_em >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) ${obraFilter}
       GROUP BY DATE(ocorrido_em)
       ORDER BY dia`,
      obraParams
    );

    return {
      kpis: {
        presentes: presentes.total,
        presentes_trabalhadores: presentes.trabalhadores,
        presentes_visitantes: presentes.visitantes,
        presentes_veiculos: presentes.veiculos,
        entradas_hoje: Number(movHoje[0]?.entradas ?? 0),
        saidas_hoje: Number(movHoje[0]?.saidas ?? 0),
        visitantes_hoje: Number(movHoje[0]?.visitantes ?? 0),
        veiculos_hoje: Number(movHoje[0]?.veiculos ?? 0),
        equipamentos_em_uso: Number(equip[0]?.em_uso ?? 0),
        equipamentos_disponiveis: Number(equip[0]?.disponiveis ?? 0),
        equipamentos_danificados: Number(equip[0]?.danificados ?? 0),
        equipamentos_desaparecidos: Number(equip[0]?.desaparecidos ?? 0),
        stock_baixo: Number(stock[0]?.baixo ?? 0),
        alertas_abertos: Number(alertas[0]?.abertos ?? 0),
      },
      series: {
        por_hora: porHora,
        por_dia: porDia,
      },
      dentro: presentes.dentro ?? [],
    };
  }
}
