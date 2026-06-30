import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateLocation } from "../../application/usecase/UpdateLocation.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().trim().max(255).nullable().optional(),
  municipality: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  mapProvider: z.string().trim().max(50).nullable().optional(),
  providerPlaceId: z.string().trim().max(150).nullable().optional()
});

export class UpdateLocationController {
  constructor(private readonly updateLocation: UpdateLocation) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);
      const input = updateLocationSchema.parse(request.body);

      const location = await this.updateLocation.execute(
        authenticatedRequest.userId,
        id,
        input
      );

      response.status(200).json({
        success: true,
        data: location
      });
    } catch (error) {
      next(error);
    }
  };
}