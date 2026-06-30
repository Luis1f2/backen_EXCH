import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListLocations } from "../../application/usecase/ListLocations.js";

const querySchema = z.object({
  municipality: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export class ListLocationsController {
  constructor(private readonly listLocations: ListLocations) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = querySchema.parse(request.query);
      const locations = await this.listLocations.execute(filters);

      response.status(200).json({
        success: true,
        data: locations
      });
    } catch (error) {
      next(error);
    }
  };
}