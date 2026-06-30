import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { DiscardAlert } from "../../application/usecase/DiscardAlert.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class DiscardAlertController {
  constructor(private readonly discardAlert: DiscardAlert) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const { id } = paramsSchema.parse(request.params);

      const alert = await this.discardAlert.execute(
        id,
        authenticatedRequest.userId
      );

      response.status(200).json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  };
}