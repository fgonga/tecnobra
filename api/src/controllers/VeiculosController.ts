import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { VeiculosService } from "../services/VeiculosService";
import { PlateOcrService } from "../services/PlateOcrService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class VeiculosController extends BaseCrudController<VeiculosService> {
  constructor() {
    super(new VeiculosService());
  }

  /** POST /api/v1/veiculos/ocr-matricula { foto: dataURL } */
  static ocrMatricula = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { foto } = (req.body as any) ?? {};
      const result = await PlateOcrService.readPlate(String(foto ?? ""));
      reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
