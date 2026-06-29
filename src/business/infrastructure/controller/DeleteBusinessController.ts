import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { DeleteBusiness } from "../../application/usecase/DeleteBusiness.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class DeleteBusinessController {
  constructor(private readonly deleteBusiness: DeleteBusiness) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);

      await this.deleteBusiness.execute(
        authenticatedRequest.userId,
        id
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}