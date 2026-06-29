import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListReviews } from "../../application/usecase/ListReviews.js";

const querySchema = z.object({
  targetType: z.enum(["destination", "business", "location"]),
  targetId: z.string().uuid()
});

export class ListReviewsController {
  constructor(private readonly listReviews: ListReviews) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = querySchema.parse(request.query);
      const reviews = await this.listReviews.execute(filters);

      response.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      next(error);
    }
  };
}