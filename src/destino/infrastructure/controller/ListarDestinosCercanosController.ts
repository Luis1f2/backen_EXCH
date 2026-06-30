import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListarDestinosCercanos } from "../../applications/usecase/ListarDestinosCercanos.js";
import { toDestinoResponse } from "../../domain/entities/Destino.js";

const cercanosSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radioKm: z.coerce.number().positive().max(200).default(10),
  tipo: z.string().trim().min(1).optional()
});

export class ListarDestinosCercanosController {
  constructor(private readonly listarDestinosCercanos: ListarDestinosCercanos) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const busqueda = cercanosSchema.parse(request.query);
      const destinos = await this.listarDestinosCercanos.execute(busqueda);

      response.status(200).json({
        success: true,
        data: destinos.map(toDestinoResponse)
      });
    } catch (error) {
      next(error);
    }
  };
}
