import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { ListEvents } from "../../application/usecase/ListEvents.js";

const querySchema = z.object({
  proximas: z.enum(["true", "false"]).optional(),
  categoriaId: z.string().trim().min(1).optional(),
});

export class ListEventsController {
  constructor(private readonly listEvents: ListEvents) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { proximas, categoriaId } = querySchema.parse(request.query);
      const events = await this.listEvents.execute({
        proximasOnly: proximas === "true",
        categoriaId,
      });

      response.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  };
}
