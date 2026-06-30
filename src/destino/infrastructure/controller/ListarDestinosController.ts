import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListarDestinos } from "../../applications/usecase/ListarDestinos.js";
import { toDestinoResponse } from "../../domain/entities/Destino.js";

const listarSchema = z.object({
  tipo: z.string().trim().min(1).optional()
});

export class ListarDestinosController {
  constructor(private readonly listarDestinos: ListarDestinos) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tipo } = listarSchema.parse(request.query);
      const destinos = await this.listarDestinos.execute(tipo);

      response.status(200).json({
        success: true,
        data: destinos.map(toDestinoResponse)
      });
    } catch (error) {
      next(error);
    }
  };
}
