import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { ListCategories } from "../../application/usecase/ListCategories.js";

const querySchema = z.object({
  scope: z.enum(["eventos", "destinos", "todos"]).default("eventos"),
});

export class ListCategoriesController {
  constructor(private readonly listCategories: ListCategories) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { scope } = querySchema.parse(request.query);
      const categories = await this.listCategories.execute(scope);

      response.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };
}
