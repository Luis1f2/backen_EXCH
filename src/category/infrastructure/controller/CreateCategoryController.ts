import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { CreateCategory } from "../../application/usecase/CreateCategory.js";

const bodySchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  icono: z.string().trim().max(100).nullable().optional(),
  aplicaAEventos: z.boolean().optional().default(true),
  aplicaADestinos: z.boolean().optional().default(false),
});

export class CreateCategoryController {
  constructor(private readonly createCategory: CreateCategory) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const input = bodySchema.parse(request.body);
      const category = await this.createCategory.execute(input);

      response.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
}
