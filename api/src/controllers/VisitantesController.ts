import { BaseCrudController } from "./BaseCrudController";
import { VisitantesService } from "../services/VisitantesService";

export class VisitantesController extends BaseCrudController<VisitantesService> {
  constructor() {
    super(new VisitantesService());
  }
}
