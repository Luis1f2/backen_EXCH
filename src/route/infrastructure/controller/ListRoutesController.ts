import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListRoutes } from "../../application/usecase/ListRoutes.js";

const querySchema = z.object({
  onlyPublic: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export class ListRoutesController {
  constructor(private readonly listRoutes: ListRoutes) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = querySchema.parse(request.query);
      const routes = await this.listRoutes.execute(filters);

      response.status(200).json({
        success: true,
        data: routes
      });
    } catch (error) {
      next(error);
    }
  };
}