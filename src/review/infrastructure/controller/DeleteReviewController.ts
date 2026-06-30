import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { DeleteReview } from "../../application/usecase/DeleteReview.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class DeleteReviewController {
  constructor(private readonly deleteReview: DeleteReview) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);

      await this.deleteReview.execute(
        authenticatedRequest.userId,
        id
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}