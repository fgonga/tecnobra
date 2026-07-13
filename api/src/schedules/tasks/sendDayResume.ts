/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */
import { AsyncTask } from "toad-scheduler";
import { HelpdeskService } from "../../services/HelpdeskService";
import { ScheduleLogger } from "../../logger/ScheduleLogger";
export async function sendDayResume() {
  ScheduleLogger.info("sendDayResume[start]");
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    await HelpdeskService.sendDayResume(dateStr);
    ScheduleLogger.info("sendDayResume[end]");
  } catch (e) {
    ScheduleLogger.error("sendDayResume[error]", e);
  }
  return null;
}

export default new AsyncTask("sendDayResume", sendDayResume);
