import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { DeleteDestination } from "../../application/usecase/DeleteDestination.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export class DeleteDestinationController {
  constructor(private readonly deleteDestination: DeleteDestination) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);

      await this.deleteDestination.execute(id);

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}