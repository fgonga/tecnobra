/*
 *  Tecnobra — Alerta de fim de dia: equipamentos ainda em uso.
 *
 *  Corre diariamente à hora configurada em parametrization
 *  (alerta_ferramentas_hora, default 18:30). Para cada equipamento em_uso,
 *  cria um alerta (sem duplicados abertos) e notifica os supervisores via
 *  fila de notificações (UnreturnedToolAlert).
 *
 *  Execução manual: bun artisan.ts alerts:run
 */

import { db } from "../../db/db";
import { AlertService } from "../../services/AlertService";
import { configCache } from "../../services/ConfigCache";
import { ScheduleLogger } from "../../logger/ScheduleLogger";
import { notificationQueue } from "../../queues";

let lastRunDay: string | null = null;

/** Verificação horária: dispara uma vez por dia à hora configurada. */
export async function unreturnedToolsAlertTick() {
  const cfg: any = await configCache.get();
  if (!cfg?.alertas_ativos) return;

  const alvo: string = cfg.alerta_ferramentas_hora ?? "18:30";
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const hoje = agora.toISOString().slice(0, 10);

  if (horaAtual < alvo || lastRunDay === hoje) return;
  lastRunDay = hoje;

  await runUnreturnedToolsAlert();
}

/** Execução direta (artisan alerts:run) — ignora hora/estado. */
export async function runUnreturnedToolsAlert(): Promise<number> {
  ScheduleLogger.info("unreturnedToolsAlert[start]");
  let criados = 0;

  try {
    const [rows]: any = await db.execute(
      `SELECT eq.id, eq.nome, eq.codigo, eq.obra_id, t.nome AS responsavel
       FROM equipamentos eq
       LEFT JOIN trabalhadores t ON t.id = eq.trabalhador_atual_id
       WHERE eq.estado = 'em_uso'`
    );

    for (const eq of rows) {
      const jaExiste = await AlertService.existsOpen(eq.obra_id, "ferramenta_nao_devolvida", "equipamento", eq.id);
      if (jaExiste) continue;

      await AlertService.create({
        obra_id: eq.obra_id,
        tipo: "ferramenta_nao_devolvida",
        referencia_tipo: "equipamento",
        referencia_id: eq.id,
        mensagem: `${eq.nome}${eq.codigo ? ` (${eq.codigo})` : ""} não foi devolvido. Responsável: ${eq.responsavel ?? "desconhecido"}.`,
      });
      await AlertService.notifySupervisors("UnreturnedToolAlert", eq.obra_id, { equipamentoId: eq.id });
      criados++;
    }

    ScheduleLogger.info(`unreturnedToolsAlert[end] ${criados} alerta(s) criado(s) de ${rows.length} equipamento(s) em uso`);
  } catch (err: any) {
    ScheduleLogger.error("unreturnedToolsAlert[error] " + String(err?.message));
  }

  return criados;
}

export default unreturnedToolsAlertTick;
