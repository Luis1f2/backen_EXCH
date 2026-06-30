import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListAlerts } from "../../application/usecase/ListAlerts.js";

const querySchema = z.object({
  typeName: z.string().trim().max(80).optional(),
  statusName: z.enum(["pendiente", "atendida", "descartada"]).optional(),
  scopeName: z.enum(["negocio", "plataforma"]).optional(),
  entityTypeName: z.enum([
    "destino",
    "negocio",
    "ubicacion",
    "resena_destino",
    "resena_negocio",
    "resena_ubicacion"
  ]).optional(),
  entityId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export class ListAlertsController {
  constructor(private readonly listAlerts: ListAlerts) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = querySchema.parse(request.query);
      const alerts = await this.listAlerts.execute(filters);

      response.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  };
}