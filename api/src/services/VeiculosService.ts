import { BaseCrudService } from "./BaseCrudService";
import { VeiculoModel, IVeiculo } from "../models/veiculo.model";
import { UploadService } from "./UploadService";

export class VeiculosService extends BaseCrudService<typeof VeiculoModel> {
  constructor() {
    super(VeiculoModel);
  }

  async store(data: IVeiculo & { foto?: string | null }): Promise<any> {
    const payload: Record<string, any> = { ...data };
    if (payload.matricula) payload.matricula = String(payload.matricula).toUpperCase().trim();
    if (payload.foto?.startsWith("data:")) {
      payload.foto = UploadService.saveDataUrl(payload.foto, "veiculos");
    }
    return super.store(payload);
  }

  async update(id: number, data: Partial<IVeiculo> & { foto?: string | null }): Promise<any> {
    const payload: Record<string, any> = { ...data };
    if (payload.matricula) payload.matricula = String(payload.matricula).toUpperCase().trim();
    if (payload.foto?.startsWith("data:")) {
      payload.foto = UploadService.saveDataUrl(payload.foto, "veiculos");
    }
    return super.update(id, payload);
  }
}
