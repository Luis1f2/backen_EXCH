import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateLocation } from "../../application/usecase/CreateLocation.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const createLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(255).nullable().optional(),
  municipality: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  mapProvider: z.string().trim().max(50).nullable().optional(),
  providerPlaceId: z.string().trim().max(150).nullable().optional()
});

export class CreateLocationController {
  constructor(private readonly createLocation: CreateLocation) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = createLocationSchema.parse(request.body);

      const location = await this.createLocation.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(201).json({
        success: true,
        data: location
      });
    } catch (error) {
      next(error);
    }
  };
}