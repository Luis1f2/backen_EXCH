import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type { UpdateBusinessService } from "../../application/usecase/UpdateBusinessService.js";

import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid()
});

const bodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional(),

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
  })
  .refine(
    (value) =>
      Object.keys(value).length > 0,
    {
      message:
        "Debes enviar al menos un campo"
    }
  );

export class UpdateBusinessServiceController {
  constructor(
    private readonly updateBusinessService:
      UpdateBusinessService
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest =
        request as AuthenticatedRequest;

      const { id, serviceId } =
        paramsSchema.parse(request.params);

      const input =
        bodySchema.parse(request.body);

      const service =
        await this.updateBusinessService.execute(
          authenticatedRequest.userId,
          id,
          serviceId,
          input
        );

      response.status(200).json({
        success: true,
        message:
          "Servicio actualizado correctamente",
        data: service
      });
    } catch (error) {
      next(error);
    }
  };
}