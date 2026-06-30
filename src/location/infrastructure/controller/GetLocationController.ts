import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetLocation } from "../../application/usecase/GetLocation.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetLocationController {
  constructor(private readonly getLocation: GetLocation) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const location = await this.getLocation.execute(id);

      response.status(200).json({
        success: true,
        data: location
      });
    } catch (error) {
      next(error);
    }
  };
}