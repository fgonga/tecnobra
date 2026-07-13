import { BaseCrudController } from "./BaseCrudController";
import { BaseCrudService } from "../services/BaseCrudService";
import { OrcamentoMaterialModel } from "../models/orcamento_material.model";

class OrcamentosService extends BaseCrudService<typeof OrcamentoMaterialModel> {
  constructor() {
    super(OrcamentoMaterialModel);
  }
}

export class OrcamentosController extends BaseCrudController<OrcamentosService> {
  constructor() {
    super(new OrcamentosService());
  }
}
