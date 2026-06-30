import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GetEvent } from "../../application/usecase/GetEvent.js";

const paramsSchema = z.object({ id: z.string().min(1) });

export class GetEventController {
  constructor(private readonly getEvent: GetEvent) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = paramsSchema.parse(request.params);
      const event = await this.getEvent.execute(id);

      response.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  };
}
