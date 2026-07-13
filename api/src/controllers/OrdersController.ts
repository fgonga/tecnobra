import { BaseCrudController } from "./BaseCrudController";
import {OrdersService} from "../services/OrdersService";

export class OrdersController extends BaseCrudController<OrdersService> {
  constructor() {
    super(new OrdersService());
  }
}
