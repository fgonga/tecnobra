import {PaymentModel} from "../models/payment.model";
import {BaseCrudService} from "./BaseCrudService";
export class PaymentsService extends BaseCrudService<typeof PaymentModel> {
    constructor() {
        super(PaymentModel)
    }
}
