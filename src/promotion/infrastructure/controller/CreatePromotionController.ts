import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { z } from "zod";

import type {
  CreatePromotion,
} from "../../application/usecase/CreatePromotion.js";
import type {
  AuthenticatedRequest,
} from "../../../http/middlewares/AuthenticatedRequest.js";
import {
  OneSignalService,
} from "../../../notifications/OneSignalService.js";

const bodySchema = z.object({
  titulo:
    z.string().trim().min(3).max(120),
  descripcion:
    z.string()
      .trim()
      .max(
        5000,
        "La descripción no puede superar los 5000 caracteres",
      )
      .nullable()
      .optional(),
  precio:
    z.number()
      .nonnegative()
      .nullable()
      .optional(),
  negocioId: z.string().min(1),
  fechaInicio: z.coerce.date(),
  fechaFin:
    z.coerce.date().nullable().optional(),
});

export class CreatePromotionController {
  private readonly notifications =
    new OneSignalService();

  constructor(
    private readonly createPromotion:
      CreatePromotion,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const input =
        bodySchema.parse(request.body);
      const userId =
        (request as AuthenticatedRequest).userId;
      const promotion =
        await this.createPromotion.execute(
          userId,
          input,
        );

      await this.notifications
        .notifyNewPromotion(
          promotion.titulo,
          promotion.descripcion,
          promotion.id,
        );

      response.status(201).json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      next(error);
    }
  };
}