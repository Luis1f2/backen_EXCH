import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type {
  UploadPromotionImage
} from "../../application/usecase/UploadPromotionImage.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

import {
  removeUploadedFileByPath
} from "../../shared/uploadFileUtils.js";

const paramsSchema = z.object({
  promocionId: z.string().uuid(),
});

export class UploadPromotionImageController {
  constructor(
    private readonly uploadPromotionImage:
      UploadPromotionImage
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
        promocionId
      } = paramsSchema.parse(
        request.params
      );

      const userId = (
        request as AuthenticatedRequest
      ).userId;

      const result =
        await this.uploadPromotionImage.execute(
          promocionId,
          userId,
          request.file.buffer
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