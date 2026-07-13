import { AsyncTask } from "toad-scheduler"
import { SettlementService } from "../../services/SettlementService"
import { configCache } from "../../services/ConfigCache"

const autoGeneralSettlement = new AsyncTask(
  "autoGeneralSettlement",
  async () => {
    const cfg = await configCache.get()
    if (!cfg.auto_settlements_enabled) return

    const record = await SettlementService.autoGenerateGeneral()
    if (record?.id) {
      console.log(`[autoGeneralSettlement] Repasse geral criado: #${record.id} (${record.period_start} → ${record.period_end}) — ${record.amount} Kz`)
      // Não dispara settlement_created para repasses gerais (só para parceiros)
    } else {
      console.log(`[autoGeneralSettlement] Nenhum repasse gerado (já existe ou sem vendas)`)
    }
  },
  (err) => {
    console.error("[autoGeneralSettlement] Erro:", err?.message ?? err)
  }
)

export default autoGeneralSettlement
