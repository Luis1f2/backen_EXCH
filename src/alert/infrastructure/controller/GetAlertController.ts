import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetAlert } from "../../application/usecase/GetAlert.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetAlertController {
  constructor(private readonly getAlert: GetAlert) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const alert = await this.getAlert.execute(id);

      response.status(200).json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  };
}