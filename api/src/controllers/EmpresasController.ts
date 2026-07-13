import { BaseCrudController } from "./BaseCrudController";
import { EmpresasService } from "../services/EmpresasService";

export class EmpresasController extends BaseCrudController<EmpresasService> {
  constructor() {
    super(new EmpresasService());
  }
}
