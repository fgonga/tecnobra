import { nanoid } from "nanoid";
import { BaseCrudService } from "./BaseCrudService";
import { TrabalhadorModel, ITrabalhador } from "../models/trabalhador.model";
import { UploadService } from "./UploadService";

export class TrabalhadoresService extends BaseCrudService<typeof TrabalhadorModel> {
  constructor() {
    super(TrabalhadorModel);
  }

  async store(data: ITrabalhador & { foto?: string | null }): Promise<any> {
    const payload: Record<string, any> = { ...data };
    payload.qr_token = nanoid(21);
    if (payload.foto?.startsWith("data:")) {
      payload.foto = UploadService.saveDataUrl(payload.foto, "fotos");
    }
    const created = await super.store(payload);
    delete created.qr_token;
    return created;
  }

  async update(id: number, data: Partial<ITrabalhador> & { foto?: string | null }): Promise<any> {
    const payload: Record<string, any> = { ...data };
    delete payload.qr_token; // o token só muda via emitir-cartao {renovar:true}
    if (payload.foto?.startsWith("data:")) {
      payload.foto = UploadService.saveDataUrl(payload.foto, "fotos");
    }
    return super.update(id, payload);
  }
}
