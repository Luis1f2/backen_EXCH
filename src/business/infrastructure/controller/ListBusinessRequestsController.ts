import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { z } from "zod";

import type { ListBusinessRequests } from "../../application/usecase/ListBusinessRequests.js";

const querySchema = z.object({
 status: z
  .enum([
    "pendiente",
    "aprobado",
    "rechazado",
    "todas",
  ])
  .default("todas"),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(200)
    .default(100),

  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0),
});

export class ListBusinessRequestsController {
  constructor(
    private readonly listBusinessRequests:
      ListBusinessRequests,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        status,
        limit,
        offset,
      } = querySchema.parse(request.query);

      const requests =
        await this.listBusinessRequests.execute(
          status,
          limit,
          offset,
        );

      response.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  };
}