import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type {
  UploadEventImage
} from "../../application/usecase/UploadEventImage.js";

import {
  removeUploadedFileByPath
} from "../../shared/uploadFileUtils.js";

const paramsSchema = z.object({
  eventoId: z.string().uuid(),
});

export class UploadEventImageController {
  constructor(
    private readonly uploadEventImage:
      UploadEventImage
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!request.file) {
        response.status(400).json({
          success: false,
          message:
            "No se recibió ninguna imagen",
        });
        return;
      }

      const {
        eventoId
      } = paramsSchema.parse(
        request.params
      );

      const result =
        await this.uploadEventImage.execute(
          eventoId,
          request.file.filename
        );

      response.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      await removeUploadedFileByPath(
        request.file?.path
      );

      next(error);
    }
  };
}