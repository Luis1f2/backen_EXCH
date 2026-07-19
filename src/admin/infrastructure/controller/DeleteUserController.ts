import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { z } from "zod";

import type { DeleteUser } from "../../application/usecase/DeleteUser.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export class DeleteUserController {
  constructor(
    private readonly deleteUser: DeleteUser,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } =
        paramsSchema.parse(request.params);

      const actingAdminId =
        (request as AuthenticatedRequest).userId;

      await this.deleteUser.execute(
        actingAdminId,
        id,
      );

      response.status(200).json({
        success: true,
        message: "Usuario desactivado correctamente",
      });
    } catch (error) {
      next(error);
    }
  };
}