import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateDestination } from "../../application/usecase/CreateDestination.js";

const createDestinationSchema = z.object({
  name: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().max(5000,"La descripción no puede superar los 5000 caracteres",).nullable().optional(),
  categoryName: z.string().trim().min(2).max(80),
  locationId: z.string().uuid()
});

export class CreateDestinationController {
  constructor(private readonly createDestination: CreateDestination) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = createDestinationSchema.parse(request.body);
      const destination = await this.createDestination.execute(input);

      response.status(201).json({
        success: true,
        data: destination
      });
    } catch (error) {
      next(error);
    }
  };
}