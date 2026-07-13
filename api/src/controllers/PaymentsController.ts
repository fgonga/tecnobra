import { BaseCrudController } from "./BaseCrudController";
import {PaymentsService} from "../services/PaymentsService";

export class PaymentsController extends BaseCrudController<PaymentsService> {
  constructor() {
    super(new PaymentsService());
  }
}
