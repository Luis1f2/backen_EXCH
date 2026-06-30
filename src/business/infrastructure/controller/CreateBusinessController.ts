import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateBusiness } from "../../application/usecase/CreateBusiness.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const createBusinessSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().nullable().optional(),
  businessTypeName: z.string().trim().min(2).max(80),
  locationId: z.string().uuid(),
  priceFrom: z.number().min(0).nullable().optional()
});

export class CreateBusinessController {
  constructor(private readonly createBusiness: CreateBusiness) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = createBusinessSchema.parse(request.body);

      const business = await this.createBusiness.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(201).json({
        success: true,
        data: business
      });
    } catch (error) {
      next(error);
    }
  };
}