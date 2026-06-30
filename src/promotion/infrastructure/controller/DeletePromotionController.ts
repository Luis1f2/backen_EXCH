import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { DeletePromotion } from "../../application/usecase/DeletePromotion.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({ id: z.string().min(1) });

export class DeletePromotionController {
  constructor(private readonly deletePromotion: DeletePromotion) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const userId = (request as AuthenticatedRequest).userId;
      await this.deletePromotion.execute(id, userId);

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
