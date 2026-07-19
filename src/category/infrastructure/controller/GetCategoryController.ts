import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { GetCategory } from "../../application/usecase/GetCategory.js";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

export class GetCategoryController {
  constructor(private readonly getCategory: GetCategory) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const category = await this.getCategory.execute(id);

      response.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
}
