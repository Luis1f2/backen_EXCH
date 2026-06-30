import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateRoute } from "../../application/usecase/UpdateRoute.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const routeDestinationSchema = z.object({
  destinationId: z.string().uuid(),
  visitOrder: z.number().int().min(1),
  visitDay: z.number().int().min(1)
});

const updateRouteSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  budget: z.number().min(0).nullable().optional(),
  durationDays: z.number().int().min(1).nullable().optional(),
  destinations: z.array(routeDestinationSchema).min(1).optional()
});

export class UpdateRouteController {
  constructor(private readonly updateRoute: UpdateRoute) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);
      const input = updateRouteSchema.parse(request.body);

      const route = await this.updateRoute.execute(
        authenticatedRequest.userId,
        id,
        input
      );

      response.status(200).json({
        success: true,
        data: route
      });
    } catch (error) {
      next(error);
    }
  };
}