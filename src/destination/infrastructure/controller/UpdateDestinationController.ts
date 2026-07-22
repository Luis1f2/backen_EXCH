import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateDestination } from "../../application/usecase/UpdateDestination.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const updateDestinationSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  descripcion: z.string().trim().max(5000,"La descripción no puede superar los 5000 caracteres",).nullable().optional(),
  categoryName: z.string().trim().min(2).max(80).optional(),
  locationId: z.string().uuid().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export class UpdateDestinationController {
  constructor(private readonly updateDestination: UpdateDestination) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const input = updateDestinationSchema.parse(request.body);

      const destination = await this.updateDestination.execute(
        id,
        input
      );

      response.status(200).json({
        success: true,
        data: destination
      });
    } catch (error) {
      next(error);
    }
  };
}