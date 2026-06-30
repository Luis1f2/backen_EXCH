import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListDestinations } from "../../application/usecase/ListDestinations.js";

const querySchema = z.object({
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  municipality: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export class ListDestinationsController {
  constructor(private readonly listDestinations: ListDestinations) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = querySchema.parse(request.query);
      const destinations = await this.listDestinations.execute(filters);

      response.status(200).json({
        success: true,
        data: destinations
      });
    } catch (error) {
      next(error);
    }
  };
}