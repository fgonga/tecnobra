import { AsyncTask } from "toad-scheduler"
import { SettlementService } from "../../services/SettlementService"
import { eventQueue } from "../../queues"
import { configCache } from "../../services/ConfigCache"

const autoPartnerSettlements = new AsyncTask(
  "autoPartnerSettlements",
  async () => {
    const cfg = await configCache.get()
    if (!cfg.auto_settlements_enabled) return

    const now = new Date()
    const dom = now.getDate()
    const day1 = cfg.settlement_day_1 ?? 6
    const day2 = cfg.settlement_day_2 ?? 20

    if (dom !== day1 && dom !== day2) return // Não é dia de repasse

    const records = await SettlementService.autoGeneratePartnerSettlements(now)

    if (records.length === 0) {
      console.log(`[autoPartnerSettlements] Nenhum repasse gerado (dia ${dom})`)
      return
    }

    console.log(`[autoPartnerSettlements] ${records.length} repasse(s) gerado(s) para dia ${dom}`)

    for (const record of records) {
      if (record?.id) {
        console.log(`  → #${record.id} influencer #${record.influencer_id} — ${record.amount} Kz`)
        await eventQueue.add("settlement-created-event", {
          type: "settlement_created",
          data: { settlementId: record.id },
        })
      }
    }
  },
  (err) => {
    console.error("[autoPartnerSettlements] Erro:", err?.message ?? err)
  }
)

export default autoPartnerSettlements
