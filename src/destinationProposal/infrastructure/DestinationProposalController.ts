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
} from "../../http/middlewares/AuthenticatedRequest.js";

import type {
  DestinationProposalService,
} from "../application/DestinationProposalService.js";

const createSchema =
  z.object({
    name:
      z.string()
        .trim()
        .min(3)
        .max(120),

    description:
      z.string()
        .trim()
        .max(5000)
        .nullable()
        .optional(),

    categoryId:
      z.string()
        .uuid(),

    locationId:
      z.string()
        .uuid(),
  });

const paramsSchema =
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

const adminQuerySchema =
  z.object({
    status:
      z.enum([
        "pendiente",
        "aprobada",
        "rechazada",
      ])
        .optional(),

    limit:
      z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50),

    offset:
      z.coerce
        .number()
        .int()
        .min(0)
        .default(0),
  });

const reviewSchema =
  z.discriminatedUnion(
    "action",
    [
      z.object({
        action:
          z.literal(
            "approve",
          ),
      }),

      z.object({
        action:
          z.literal(
            "reject",
          ),

        reason:
          z.string()
            .trim()
            .min(3)
            .max(2000),
      }),
    ],
  );

export class DestinationProposalController {
  constructor(
    private readonly service:
      DestinationProposalService,
  ) {}

  create = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const input =
        createSchema.parse(
          request.body,
        );

      const proposal =
        await this.service
          .create(
            userId,

            {
              name:
                input.name,

              description:
                input.description ??
                null,

              categoryId:
                input.categoryId,

              locationId:
                input.locationId,
            },
          );

      response
        .status(201)
        .json({
          success: true,

          data:
            proposal,
        });
    } catch (error) {
      next(error);
    }
  };

  uploadImages = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const {
        id,
      } =
        paramsSchema.parse(
          request.params,
        );

      const files =
        Array.isArray(
          request.files,
        )
          ? request.files
          : [];

      const proposal =
        await this.service
          .uploadImages(
            id,
            userId,
            files,
          );

      response
        .status(200)
        .json({
          success: true,

          data:
            proposal,
        });
    } catch (error) {
      next(error);
    }
  };

  deleteImage = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const {
        id,
        imageId,
      } =
        imageParamsSchema.parse(
          request.params,
        );

      const proposal =
        await this.service
          .deleteImage(
            id,
            imageId,
            userId,
          );

      response
        .status(200)
        .json({
          success: true,

          data:
            proposal,
        });
    } catch (error) {
      next(error);
    }
  };

  mine = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const proposals =
        await this.service
          .listMine(
            userId,
          );

      response
        .status(200)
        .json({
          success: true,

          data:
            proposals,
        });
    } catch (error) {
      next(error);
    }
  };

  adminList = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        status,
        limit,
        offset,
      } =
        adminQuerySchema
          .parse(
            request.query,
          );

      const proposals =
        await this.service
          .listAdmin(
            status,
            limit,
            offset,
          );

      response
        .status(200)
        .json({
          success: true,

          data:
            proposals,
        });
    } catch (error) {
      next(error);
    }
  };

  adminGet = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        id,
      } =
        paramsSchema.parse(
          request.params,
        );

      const proposal =
        await this.service
          .getAdmin(id);

      response
        .status(200)
        .json({
          success: true,

          data:
            proposal,
        });
    } catch (error) {
      next(error);
    }
  };

  review = async (
    request: Request,

    response: Response,

    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminUserId =
        (
          request as
            AuthenticatedRequest
        ).userId;

      const {
        id,
      } =
        paramsSchema.parse(
          request.params,
        );

      const input =
        reviewSchema.parse(
          request.body,
        );

      const proposal =
        await this.service
          .review(
            id,
            adminUserId,
            input,
          );

      response
        .status(200)
        .json({
          success: true,

          data:
            proposal,
        });
    } catch (error) {
      next(error);
    }
  };
}
