import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateEvent } from "../../application/usecase/UpdateEvent.js";

const paramsSchema = z.object({ id: z.string().min(1) });

const bodySchema = z.object({
  titulo: z.string().trim().min(3).max(120).optional(),
  descripcion: z.string().trim().nullable().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().nullable().optional(),
  ubicacionId: z.string().min(1).nullable().optional(),
  categoriaId: z.string().min(1).nullable().optional()
});

export class UpdateEventController {
  constructor(private readonly updateEvent: UpdateEvent) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const data = bodySchema.parse(request.body);
      const event = await this.updateEvent.execute(id, data);

      response.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  };
}
