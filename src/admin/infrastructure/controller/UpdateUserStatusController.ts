import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateUserStatus } from "../../application/usecase/UpdateUserStatus.js";

const paramsSchema = z.object({ id: z.string().min(1) });

const bodySchema = z.object({
  activo: z.boolean().optional(),
  tipoUsuarioNombre: z.enum([
    "turista_nacional", "turista_extranjero",
    "habitante_local", "admin_plataforma"
  ]).optional()
});

export class UpdateUserStatusController {
  constructor(private readonly updateUserStatus: UpdateUserStatus) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const input = bodySchema.parse(request.body);
      const result = await this.updateUserStatus.execute(id, input);

      response.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
