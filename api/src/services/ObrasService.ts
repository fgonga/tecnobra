import { BaseCrudService } from "./BaseCrudService";
import { ObraModel } from "../models/obra.model";

export class ObrasService extends BaseCrudService<typeof ObraModel> {
  constructor() {
    super(ObraModel);
  }
}
