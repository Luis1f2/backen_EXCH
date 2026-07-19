import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type {
  DeletePromotionImage
} from "../../application/usecase/DeletePromotionImage.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  promocionId: z.string().uuid(),
});

export class DeletePromotionImageController {
  constructor(
    private readonly deletePromotionImage:
      DeletePromotionImage
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        promocionId
      } = paramsSchema.parse(
        request.params
      );

      const userId = (
        request as AuthenticatedRequest
      ).userId;

      await this.deletePromotionImage.execute(
        promocionId,
        userId
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}