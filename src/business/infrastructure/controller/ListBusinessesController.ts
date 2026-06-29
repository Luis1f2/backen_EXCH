import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListBusinesses } from "../../application/usecase/ListBusinesses.js";

const querySchema = z.object({
  businessTypeId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  municipality: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  isVerified: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export class ListBusinessesController {
  constructor(private readonly listBusinesses: ListBusinesses) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = querySchema.parse(request.query);
      const businesses = await this.listBusinesses.execute(filters);

      response.status(200).json({
        success: true,
        data: businesses
      });
    } catch (error) {
      next(error);
    }
  };
}