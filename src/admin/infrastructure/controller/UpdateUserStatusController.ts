import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { z } from "zod";

import type { UpdateUserStatus } from "../../application/usecase/UpdateUserStatus.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    email: z
      .string()
      .trim()
      .email()
      .max(150)
      .optional(),

    telefono: z
      .string()
      .trim()
      .max(20)
      .nullable()
      .optional(),

    activo: z
      .boolean()
      .optional(),

    tipoUsuarioNombre: z
      .enum([
        "turista_nacional",
        "turista_extranjero",
        "habitante_local",
        "admin_negocio",
        "admin_plataforma",
      ])
      .optional(),
  })
  .refine(
    (body) =>
      Object.values(body).some(
        (value) => value !== undefined,
      ),
    {
      message:
        "Debes proporcionar al menos un campo para actualizar",
    },
  );

export class UpdateUserStatusController {
  constructor(
    private readonly updateUserStatus: UpdateUserStatus,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } =
        paramsSchema.parse(request.params);

      const input =
        bodySchema.parse(request.body);

      const actingAdminId =
        (request as AuthenticatedRequest).userId;

      const result =
        await this.updateUserStatus.execute(
          actingAdminId,
          id,
          input,
        );

      response.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}