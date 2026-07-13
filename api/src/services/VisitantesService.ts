import { nanoid } from "nanoid";
import { BaseCrudService } from "./BaseCrudService";
import { VisitanteModel, IVisitante } from "../models/visitante.model";
import { notificationQueue } from "../queues";

export class VisitantesService extends BaseCrudService<typeof VisitanteModel> {
  constructor() {
    super(VisitanteModel);
  }

  async store(data: IVisitante & { enviar_cartao?: boolean }): Promise<any> {
    const enviarCartao = data.enviar_cartao !== false;
    const payload: Record<string, any> = { ...data };
    delete payload.enviar_cartao;
    payload.qr_token = nanoid(21);

    const created = await super.store(payload);

    // Envia o cartão digital (email + whatsapp, conforme templates ativos)
    if (enviarCartao && (payload.email || payload.telefone)) {
      await notificationQueue.add("notification", {
        notify: "VisitorCardIssued",
        context: { visitanteId: created.id },
      });
    }

    delete created.qr_token;
    return created;
  }

  async update(id: number, data: Partial<IVisitante>): Promise<any> {
    const payload: Record<string, any> = { ...data };
    delete payload.qr_token;
    return super.update(id, payload);
  }
}
