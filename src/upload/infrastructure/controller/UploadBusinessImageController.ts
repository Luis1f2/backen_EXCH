import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UploadBusinessImage } from "../../application/usecase/UploadBusinessImage.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({ negocioId: z.string().min(1) });

export class UploadBusinessImageController {
  constructor(private readonly uploadBusinessImage: UploadBusinessImage) {}

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

      const { negocioId } = paramsSchema.parse(request.params);
      const userId = (request as AuthenticatedRequest).userId;
      const result = await this.uploadBusinessImage.execute(
        negocioId,
        userId,
        request.file.filename
      );

      response.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
