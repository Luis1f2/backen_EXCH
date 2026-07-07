import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type { GetBusinessSchedules } from "../../application/usecase/GetBusinessSchedules.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class GetBusinessSchedulesController {
  constructor(
    private readonly getBusinessSchedules: GetBusinessSchedules
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest =
        request as AuthenticatedRequest;

      const { id } = paramsSchema.parse(request.params);

      const schedules =
        await this.getBusinessSchedules.execute(
          authenticatedRequest.userId,
          id
        );

      response.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error) {
      next(error);
    }
  };
}