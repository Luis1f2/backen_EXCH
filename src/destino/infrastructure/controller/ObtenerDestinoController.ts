import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ObtenerDestino } from "../../applications/usecase/ObtenerDestino.js";
import { toDestinoResponse } from "../../domain/entities/Destino.js";

const paramsSchema = z.object({
  id: z.string().min(1)
});

export class ObtenerDestinoController {
  constructor(private readonly obtenerDestino: ObtenerDestino) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const destino = await this.obtenerDestino.execute(id);

      response.status(200).json({
        success: true,
        data: toDestinoResponse(destino)
      });
    } catch (error) {
      next(error);
    }
  };
}
