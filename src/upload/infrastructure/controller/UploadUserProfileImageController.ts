import type {
  NextFunction,
  Request,
  Response
} from "express";

import type {
  UploadUserProfileImage
} from "../../application/usecase/UploadUserProfileImage.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

import {
  removeUploadedFileByPath
} from "../../shared/uploadFileUtils.js";

export class UploadUserProfileImageController {
  constructor(
    private readonly uploadUserProfileImage:
      UploadUserProfileImage
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

      const userId = (
        request as AuthenticatedRequest
      ).userId;

      const result =
        await this.uploadUserProfileImage.execute(
          userId,
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