import { CouponsService } from "../services/CouponsService";
import { BaseCrudController } from "./BaseCrudController";

export class CouponsController extends BaseCrudController<CouponsService> {
  constructor() {
    super(new CouponsService());
  }
}
