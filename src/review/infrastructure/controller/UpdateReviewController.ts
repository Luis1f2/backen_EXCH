import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateReview } from "../../application/usecase/UpdateReview.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).nullable().optional()
});

export class UpdateReviewController {
  constructor(private readonly updateReview: UpdateReview) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);
      const input = updateReviewSchema.parse(request.body);

      const review = await this.updateReview.execute(
        authenticatedRequest.userId,
        id,
        input
      );

      response.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  };
}