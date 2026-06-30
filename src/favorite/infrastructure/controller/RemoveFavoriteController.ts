import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { RemoveFavorite } from "../../application/usecase/RemoveFavorite.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  targetType: z.enum(["destination", "business"]),
  targetId: z.string().uuid()
});

export class RemoveFavoriteController {
  constructor(private readonly removeFavorite: RemoveFavorite) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { targetType, targetId } = paramsSchema.parse(
        request.params
      );

      await this.removeFavorite.execute(
        authenticatedRequest.userId,
        targetType,
        targetId
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}