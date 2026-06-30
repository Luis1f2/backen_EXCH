import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetReview } from "../../application/usecase/GetReview.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetReviewController {
  constructor(private readonly getReview: GetReview) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const review = await this.getReview.execute(id);

      response.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  };
}