import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListPromotions } from "../../application/usecase/ListPromotions.js";

const querySchema = z.object({
  negocioId: z.string().min(1).optional()
});

export class ListPromotionsController {
  constructor(private readonly listPromotions: ListPromotions) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { negocioId } = querySchema.parse(request.query);
      const promotions = await this.listPromotions.execute(negocioId);

      response.status(200).json({ success: true, data: promotions });
    } catch (error) {
      next(error);
    }
  };
}
