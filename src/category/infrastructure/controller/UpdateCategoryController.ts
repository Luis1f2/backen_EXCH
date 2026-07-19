import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { UpdateCategory } from "../../application/usecase/UpdateCategory.js";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const bodySchema = z
  .object({
    nombre: z.string().trim().min(2).max(100).optional(),
    icono: z.string().trim().max(100).nullable().optional(),
    aplicaAEventos: z.boolean().optional(),
    aplicaADestinos: z.boolean().optional(),
  })
  .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export class UpdateCategoryController {
  constructor(private readonly updateCategory: UpdateCategory) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const data = bodySchema.parse(request.body);
      const category = await this.updateCategory.execute(id, data);

      response.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
}
