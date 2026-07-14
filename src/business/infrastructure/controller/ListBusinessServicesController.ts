import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type { ListBusinessServices } from "../../application/usecase/ListBusinessServices.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class ListBusinessServicesController {
  constructor(
    private readonly listBusinessServices:
      ListBusinessServices
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } =
        paramsSchema.parse(request.params);

      const services =
        await this.listBusinessServices.execute(
          id
        );

      response.status(200).json({
        success: true,
        data: services
      });
    } catch (error) {
      next(error);
    }
  };
}