import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateBusiness } from "../../application/usecase/UpdateBusiness.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const updateBusinessSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  descripcion: z.string().trim().max(5000,"La descripción no puede superar los 5000 caracteres",).nullable().optional(),
  businessTypeName: z.string().trim().min(2).max(80).optional(),
  locationId: z.string().uuid().optional(),
  priceFrom: z.number().min(0).nullable().optional()
});

export class UpdateBusinessController {
  constructor(private readonly updateBusiness: UpdateBusiness) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);
      const input = updateBusinessSchema.parse(request.body);

      const business = await this.updateBusiness.execute(
        authenticatedRequest.userId,
        id,
        input
      );

      response.status(200).json({
        success: true,
        data: business
      });
    } catch (error) {
      next(error);
    }
  };
}