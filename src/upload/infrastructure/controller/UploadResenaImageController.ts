import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type {
  ResenaType,
  UploadResenaImage
} from "../../application/usecase/UploadResenaImage.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({ resenaId: z.string().min(1) });

const querySchema = z.object({
  tipo: z.enum(["resena_destino", "resena_negocio", "resena_ubicacion"])
});

export class UploadResenaImageController {
  constructor(private readonly uploadResenaImage: UploadResenaImage) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!request.file) {
        response.status(400).json({
          success: false,
          message: "No se recibio ninguna imagen"
        });
        return;
      }

      const { resenaId } = paramsSchema.parse(request.params);
      const { tipo } = querySchema.parse(request.query);
      const userId = (request as AuthenticatedRequest).userId;
      const result = await this.uploadResenaImage.execute(
        resenaId,
        tipo as ResenaType,
        userId,
        request.file.filename
      );

      response.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
