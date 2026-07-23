import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  z,
} from "zod";

import type {
  AuthenticatedRequest,
} from "../../../http/middlewares/AuthenticatedRequest.js";

import type {
  BusinessGalleryService,
} from "../../application/usecase/BusinessGalleryService.js";

const businessParamsSchema =
  z.object({
    id:
      z.string()
        .uuid(),
  });

const imageParamsSchema =
  z.object({
    id:
      z.string()
        .uuid(),

    imageId:
      z.string()
        .uuid(),
  });

export class BusinessGalleryController {
  constructor(
    private readonly service:
      BusinessGalleryService,
  ) {}

  list = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        id,
      } =
        businessParamsSchema.parse(
          request.params,
        );

      const gallery =
        await this.service
          .list(id);

      response.status(200).json({
        success: true,
        data: gallery,
      });
    } catch (error) {
      next(error);
    }
  };

  upload = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        id,
      } =
        businessParamsSchema.parse(
          request.params,
        );

      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const files =
        Array.isArray(
          request.files,
        )
          ? request.files
          : [];

      const gallery =
        await this.service
          .upload(
            id,
            userId,
            files,
          );

      response.status(201).json({
        success: true,
        data: gallery,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        id,
        imageId,
      } =
        imageParamsSchema.parse(
          request.params,
        );

      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const gallery =
        await this.service
          .delete(
            id,
            imageId,
            userId,
          );

      response.status(200).json({
        success: true,
        data: gallery,
      });
    } catch (error) {
      next(error);
    }
  };
}
