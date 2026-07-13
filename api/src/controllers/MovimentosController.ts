import { BaseCrudController } from "./BaseCrudController";
import { BaseCrudService } from "../services/BaseCrudService";
import { MovimentoModel } from "../models/movimento.model";

class MovimentosService extends BaseCrudService<typeof MovimentoModel> {
  constructor() {
    super(MovimentoModel);
  }
}

export class MovimentosController extends BaseCrudController<MovimentosService> {
  constructor() {
    super(new MovimentosService());
  }
}
