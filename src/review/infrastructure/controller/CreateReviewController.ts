import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { CreateReview } from "../../application/usecase/CreateReview.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const createReviewSchema = z.object({
  targetType: z.enum(["destination", "business", "location"]),
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).nullable().optional()
});

export class CreateReviewController {
  constructor(private readonly createReview: CreateReview) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = createReviewSchema.parse(request.body);

      const review = await this.createReview.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  };
}