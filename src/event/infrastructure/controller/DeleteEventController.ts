import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { DeleteEvent } from "../../application/usecase/DeleteEvent.js";

const paramsSchema = z.object({ id: z.string().min(1) });

export class DeleteEventController {
  constructor(private readonly deleteEvent: DeleteEvent) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      await this.deleteEvent.execute(id);

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
