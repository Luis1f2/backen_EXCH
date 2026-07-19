import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type { DeleteBusinessService } from "../../application/usecase/DeleteBusinessServices.js";

import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid()
});

export class DeleteBusinessServiceController {
  constructor(
    private readonly deleteBusinessService:
      DeleteBusinessService
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest =
        request as AuthenticatedRequest;

      const { id, serviceId } =
        paramsSchema.parse(request.params);

      await this.deleteBusinessService.execute(
        authenticatedRequest.userId,
        id,
        serviceId
      );

      response.status(200).json({
        success: true,
        message:
          "Servicio eliminado correctamente"
      });
    } catch (error) {
      next(error);
    }
  };
}