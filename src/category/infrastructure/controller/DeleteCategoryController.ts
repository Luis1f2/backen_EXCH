import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { z } from "zod";

import type { DeleteCategory } from "../../application/usecase/DeleteCategory.js";

const paramsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1),
});

export class DeleteCategoryController {
  constructor(
    private readonly deleteCategory:
      DeleteCategory,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } =
        paramsSchema.parse(
          request.params,
        );

      await this.deleteCategory.execute(id);

      response.status(200).json({
        success: true,
        message:
          "Categoría eliminada correctamente",
      });
    } catch (error) {
      next(error);
    }
  };
}