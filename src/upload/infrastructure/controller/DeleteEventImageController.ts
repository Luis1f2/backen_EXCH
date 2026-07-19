import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type {
  DeleteEventImage
} from "../../application/usecase/DeleteEventImage.js";

const paramsSchema = z.object({
  eventoId: z.string().uuid(),
});

export class DeleteEventImageController {
  constructor(
    private readonly deleteEventImage:
      DeleteEventImage
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        eventoId
      } = paramsSchema.parse(
        request.params
      );

      await this.deleteEventImage.execute(
        eventoId
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}