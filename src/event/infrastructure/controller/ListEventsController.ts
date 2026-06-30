import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListEvents } from "../../application/usecase/ListEvents.js";

const querySchema = z.object({
  proximas: z.enum(["true", "false"]).optional()
});

export class ListEventsController {
  constructor(private readonly listEvents: ListEvents) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { proximas } = querySchema.parse(request.query);
      const events = await this.listEvents.execute(proximas === "true");

      response.status(200).json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  };
}
