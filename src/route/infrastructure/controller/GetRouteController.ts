import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetRoute } from "../../application/usecase/GetRoute.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetRouteController {
  constructor(private readonly getRoute: GetRoute) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const route = await this.getRoute.execute(id);

      response.status(200).json({
        success: true,
        data: route
      });
    } catch (error) {
      next(error);
    }
  };
}