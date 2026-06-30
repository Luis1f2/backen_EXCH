import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListMyFavorites } from "../../application/usecase/ListMyFavorites.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const querySchema = z.object({
  targetType: z.enum(["destination", "business"]).optional()
});

export class ListMyFavoritesController {
  constructor(private readonly listMyFavorites: ListMyFavorites) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = querySchema.parse(request.query);

      const favorites = await this.listMyFavorites.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(200).json({
        success: true,
        data: favorites
      });
    } catch (error) {
      next(error);
    }
  };
}