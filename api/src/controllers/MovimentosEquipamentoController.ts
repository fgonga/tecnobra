import { BaseCrudController } from "./BaseCrudController";
import { BaseCrudService } from "../services/BaseCrudService";
import { MovimentoEquipamentoModel } from "../models/movimento_equipamento.model";

class MovimentosEquipamentoService extends BaseCrudService<typeof MovimentoEquipamentoModel> {
  constructor() {
    super(MovimentoEquipamentoModel);
  }
}

export class MovimentosEquipamentoController extends BaseCrudController<MovimentosEquipamentoService> {
  constructor() {
    super(new MovimentosEquipamentoService());
  }
}
