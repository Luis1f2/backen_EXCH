import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetBusiness } from "../../application/usecase/GetBusiness.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetBusinessController {
  constructor(private readonly getBusiness: GetBusiness) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const business = await this.getBusiness.execute(id);

      response.status(200).json({
        success: true,
        data: business
      });
    } catch (error) {
      next(error);
    }
  };
}