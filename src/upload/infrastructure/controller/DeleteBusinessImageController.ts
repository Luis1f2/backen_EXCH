import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type {
  DeleteBusinessImage
} from "../../application/usecase/DeleteBusinessImage.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  negocioId: z.string().uuid(),
});

export class DeleteBusinessImageController {
  constructor(
    private readonly deleteBusinessImage:
      DeleteBusinessImage
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        negocioId
      } = paramsSchema.parse(
        request.params
      );

      const userId = (
        request as AuthenticatedRequest
      ).userId;

      await this.deleteBusinessImage.execute(
        negocioId,
        userId
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}