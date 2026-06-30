import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateRoute } from "../../application/usecase/CreateRoute.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const routeDestinationSchema = z.object({
  destinationId: z.string().uuid(),
  visitOrder: z.number().int().min(1),
  visitDay: z.number().int().min(1)
});

const createRouteSchema = z.object({
  name: z.string().trim().min(3).max(120),
  budget: z.number().min(0).nullable().optional(),
  durationDays: z.number().int().min(1).nullable().optional(),
  destinations: z.array(routeDestinationSchema).min(1)
});

export class CreateRouteController {
  constructor(private readonly createRoute: CreateRoute) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = createRouteSchema.parse(request.body);

      const route = await this.createRoute.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(201).json({
        success: true,
        data: route
      });
    } catch (error) {
      next(error);
    }
  };
}