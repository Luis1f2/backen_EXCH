import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateEvent } from "../../application/usecase/CreateEvent.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const bodySchema = z.object({
  titulo: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().nullable().optional(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().nullable().optional(),
  ubicacionId: z.string().min(1).nullable().optional(),
  categoriaId: z.string().min(1).nullable().optional()
});

export class CreateEventController {
  constructor(private readonly createEvent: CreateEvent) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = bodySchema.parse(request.body);
      const userId = (request as AuthenticatedRequest).userId;
      const event = await this.createEvent.execute(userId, input);

      response.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  };
}
