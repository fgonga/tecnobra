import {OrderModel} from "../models/order.model";
import {BaseCrudService} from "./BaseCrudService";
export class OrdersService extends BaseCrudService<typeof OrderModel> {
    constructor() {
        super(OrderModel)
    }
}
