import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdatePromotion } from "../../application/usecase/UpdatePromotion.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({ id: z.string().min(1) });

const bodySchema = z.object({
  titulo: z.string().trim().min(3).max(120).optional(),
  descripcion: z.string().trim().nullable().optional(),
  precio: z.number().nonnegative().nullable().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().nullable().optional()
});

export class UpdatePromotionController {
  constructor(private readonly updatePromotion: UpdatePromotion) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const data = bodySchema.parse(request.body);
      const userId = (request as AuthenticatedRequest).userId;
      const promotion = await this.updatePromotion.execute(id, userId, data);

      response.status(200).json({ success: true, data: promotion });
    } catch (error) {
      next(error);
    }
  };
}
