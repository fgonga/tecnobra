import { BaseCrudService } from "./BaseCrudService";
import { EmpresaModel } from "../models/empresa.model";

export class EmpresasService extends BaseCrudService<typeof EmpresaModel> {
  constructor() {
    super(EmpresaModel);
  }
}
