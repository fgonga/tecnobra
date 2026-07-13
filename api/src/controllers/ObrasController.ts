import { BaseCrudController } from "./BaseCrudController";
import { ObrasService } from "../services/ObrasService";

export class ObrasController extends BaseCrudController<ObrasService> {
  constructor() {
    super(new ObrasService());
  }
}
