import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ValidateBusiness } from "../../application/usecase/ValidateBusiness.js";

const paramsSchema = z.object({ id: z.string().min(1) });

const bodySchema = z.object({
  action: z.enum(["approve", "reject"])
});

export class ValidateBusinessController {
  constructor(private readonly validateBusiness: ValidateBusiness) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const { action } = bodySchema.parse(request.body);
      const result = await this.validateBusiness.execute(id, action);

      response.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
