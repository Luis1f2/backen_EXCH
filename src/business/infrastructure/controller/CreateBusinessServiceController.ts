import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type { CreateBusinessService } from "../../application/usecase/CreateBusinessService.js";

import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const bodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(120),

  description: z
    .string()
    .trim()
    .max(255)
    .nullable()
    .optional(),

  additionalPrice: z
    .number()
    .nonnegative()
    .nullable()
    .optional()
});

export class CreateBusinessServiceController {
  constructor(
    private readonly createBusinessService:
      CreateBusinessService
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest =
        request as AuthenticatedRequest;

      const { id } =
        paramsSchema.parse(request.params);

      const input =
        bodySchema.parse(request.body);

      const service =
        await this.createBusinessService.execute(
          authenticatedRequest.userId,
          id,
          input
        );

      response.status(201).json({
        success: true,
        message:
          "Servicio creado correctamente",
        data: service
      });
    } catch (error) {
      next(error);
    }
  };
}