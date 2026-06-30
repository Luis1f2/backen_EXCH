import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetBusinessStats } from "../../application/usecase/GetBusinessStats.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({ negocioId: z.string().min(1) });

export class GetBusinessStatsController {
  constructor(private readonly getBusinessStats: GetBusinessStats) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { negocioId } = paramsSchema.parse(request.params);
      const userId = (request as AuthenticatedRequest).userId;
      const stats = await this.getBusinessStats.execute(negocioId, userId);

      response.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
