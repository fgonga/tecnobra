import { BaseCrudController } from "./BaseCrudController";
import { BaseCrudService } from "../services/BaseCrudService";
import { DesempenhoModel } from "../models/desempenho.model";
import { MetricaDesempenhoModel } from "../models/metrica_desempenho.model";

class DesempenhosService extends BaseCrudService<typeof DesempenhoModel> {
  constructor() {
    super(DesempenhoModel);
  }
}

class MetricasService extends BaseCrudService<typeof MetricaDesempenhoModel> {
  constructor() {
    super(MetricaDesempenhoModel);
  }
}

export class DesempenhosController extends BaseCrudController<DesempenhosService> {
  constructor() {
    super(new DesempenhosService());
  }
}

export class MetricasDesempenhoController extends BaseCrudController<MetricasService> {
  constructor() {
    super(new MetricasService());
  }
}
