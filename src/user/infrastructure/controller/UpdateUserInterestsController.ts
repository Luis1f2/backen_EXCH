import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type {
  UpdateUserInterests
} from "../../application/usecase/UpdateUserInterests.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

const updateInterestsSchema = z.object({
  categoryIds: z
    .array(
      z.string().uuid()
    )
    .min(
      1,
      "Debes seleccionar al menos un interés"
    )
    .max(
      20,
      "Demasiados intereses seleccionados"
    ),
});

export class UpdateUserInterestsController {
  constructor(
    private readonly updateUserInterests:
      UpdateUserInterests
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (
        request as AuthenticatedRequest
      ).userId;

      const {
        categoryIds
      } = updateInterestsSchema.parse(
        request.body
      );

      const result =
        await this.updateUserInterests.execute(
          userId,
          categoryIds
        );

      response.status(200).json({
        success: true,
        message:
          "Intereses actualizados correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}