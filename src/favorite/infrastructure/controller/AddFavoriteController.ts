import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { AddFavorite } from "../../application/usecase/AddFavorite.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const addFavoriteSchema = z.object({
  targetType: z.enum(["destination", "business"]),
  targetId: z.string().uuid()
});

export class AddFavoriteController {
  constructor(private readonly addFavorite: AddFavorite) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = addFavoriteSchema.parse(request.body);

      const favorite = await this.addFavorite.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(201).json({
        success: true,
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  };
}