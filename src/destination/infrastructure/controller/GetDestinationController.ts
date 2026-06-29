import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetDestination } from "../../application/usecase/GetDestination.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetDestinationController {
  constructor(private readonly getDestination: GetDestination) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const destination = await this.getDestination.execute(id);

      response.status(200).json({
        success: true,
        data: destination
      });
    } catch (error) {
      next(error);
    }
  };
}