import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateAlert } from "../../application/usecase/CreateAlert.js";

const createAlertSchema = z.object({
  typeName: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(255),
  scopeName: z.enum(["negocio", "plataforma"]),
  entityType: z.enum([
    "destino",
    "negocio",
    "ubicacion",
    "resena_destino",
    "resena_negocio",
    "resena_ubicacion"
  ]).nullable().optional(),
  entityId: z.string().uuid().nullable().optional()
});

export class CreateAlertController {
  constructor(private readonly createAlert: CreateAlert) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = createAlertSchema.parse(request.body);
      const alert = await this.createAlert.execute(input);

      response.status(201).json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  };
}