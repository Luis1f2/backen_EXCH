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

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import {
  ANALYTICS_EVENT_TYPES,
  type PremiumAnalyticsService,
} from "../../application/PremiumAnalyticsService.js";


const eventSchema =
  z.object({
    type:
      z.enum(
        ANALYTICS_EVENT_TYPES,
      ),


    destinationId:
      z.string()
        .uuid()
        .nullable()
        .optional(),


    businessId:
      z.string()
        .uuid()
        .nullable()
        .optional(),


    categoryId:
      z.string()
        .uuid()
        .nullable()
        .optional(),


    searchTerm:
      z.string()
        .trim()
        .max(255)
        .nullable()
        .optional(),


    municipality:
      z.string()
        .trim()
        .max(150)
        .nullable()
        .optional(),


    metadata:
      z.record(
        z.string(),
        z.unknown(),
      )
        .optional(),
  });


const preferenceSchema =
  z.object({
    budgetMin:
      z.number()
        .nonnegative()
        .nullable()
        .optional(),

    budgetMax:
      z.number()
        .nonnegative()
        .nullable()
        .optional(),

    currency:
      z.string()
        .trim()
        .length(3)
        .default("MXN"),
  })
    .refine(
      (value) =>
        value.budgetMin == null ||
        value.budgetMax == null ||
        value.budgetMax >= value.budgetMin,
      {
        message:
          "El presupuesto máximo debe ser mayor o igual al mínimo",
      },
    );


const capacitySchema =
  z.object({
    dailyCapacity:
      z.number()
        .int()
        .positive(),

    alertThreshold:
      z.number()
        .int()
        .min(1)
        .max(100)
        .default(80),

    source:
      z.string()
        .trim()
        .max(255)
        .nullable()
        .optional(),
  });


const destinationIdSchema =
  z.object({
    destinationId:
      z.string()
        .uuid(),
  });


const filtersSchema =
  z.object({
    from:
      z.coerce
        .date()
        .optional(),


    to:
      z.coerce
        .date()
        .optional(),


    municipality:
      z.string()
        .trim()
        .min(1)
        .max(150)
        .optional(),


    categoryId:
      z.string()
        .uuid()
        .optional(),
  });


const rankingSchema =
  filtersSchema.extend({
    metric:
      z.enum([
        "searches",
        "views",
        "favorites",
        "visitIntents",
        "routes",
      ])
        .default(
          "views",
        ),


    limit:
      z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10),
  });


function parseFilters(
  query:
    Request["query"],
) {
  const parsed =
    filtersSchema.parse(
      query,
    );


  const to =
    parsed.to ??
    new Date();


  const from =
    parsed.from ??
    new Date(
      to.getTime() -
      29 *
      24 *
      60 *
      60 *
      1000,
    );


  if (
    from >
    to
  ) {
    throw new AppError(
      "La fecha inicial no puede ser posterior a la fecha final",
      400,
    );
  }


  return {
    from,
    to,

    municipality:
      parsed.municipality,

    categoryId:
      parsed.categoryId,
  };
}


export class PremiumAnalyticsController {
  constructor(
    private readonly service:
      PremiumAnalyticsService,
  ) {}


  recordEvent =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const body =
          eventSchema.parse(
            request.body,
          );


        const userId =
          (
            request as Partial<
              AuthenticatedRequest
            >
          ).userId ??
          null;


        const data =
          await this.service
            .recordEvent({
              userId,
              ...body,
            });


        response
          .status(201)
          .json({
            success: true,

            data,
          });
      } catch (
        error
      ) {
        next(error);
      }
    };


  report =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const data =
          await this.service
            .getReport(
              parseFilters(
                request.query,
              ),
            );


        response.json({
          success: true,

          data,
        });
      } catch (
        error
      ) {
        next(error);
      }
    };


  trends =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const data =
          await this.service
            .getTrends(
              parseFilters(
                request.query,
              ),
            );


        response.json({
          success: true,

          data,
        });
      } catch (
        error
      ) {
        next(error);
      }
    };


  rankings =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const parsed =
          rankingSchema.parse(
            request.query,
          );


        const data =
          await this.service
            .getDestinationRanking(
              parseFilters(
                request.query,
              ),

              parsed.metric,

              parsed.limit,
            );


        response.json({
          success: true,

          data,
        });
      } catch (
        error
      ) {
        next(error);
      }
    };


  heatmap =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const data =
          await this.service
            .getHeatmap(
              parseFilters(
                request.query,
              ),
            );


        response.json({
          success: true,

          data,
        });
      } catch (
        error
      ) {
        next(error);
      }
    };

  savePreference =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const body =
          preferenceSchema.parse(
            request.body,
          );

        const userId =
          (
            request as
              AuthenticatedRequest
          ).userId;

        await this.service
          .saveTravelPreference(
            userId,
            body,
          );

        response
          .status(204)
          .send();
      } catch (error) {
        next(error);
      }
    };


  opportunities =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        response.json({
          success: true,

          data:
            await this.service
              .getOpportunities(
                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (error) {
        next(error);
      }
    };


  audienceTypes =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        response.json({
          success: true,

          data:
            await this.service
              .getAudienceTypes(
                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (error) {
        next(error);
      }
    };


  audienceInterests =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        response.json({
          success: true,

          data:
            await this.service
              .getAudienceInterests(
                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (error) {
        next(error);
      }
    };


  audienceBudget =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        response.json({
          success: true,

          data:
            await this.service
              .getAudienceBudget(
                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (error) {
        next(error);
      }
    };


  municipalities =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        response.json({
          success: true,

          data:
            await this.service
              .getMunicipalities(
                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (error) {
        next(error);
      }
    };


  saveDestinationCapacity =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const {
          destinationId,
        } =
          destinationIdSchema.parse(
            request.params,
          );


        const body =
          capacitySchema.parse(
            request.body,
          );


        response.json({
          success: true,

          data:
            await this.service
              .saveDestinationCapacity(
                destinationId,
                body,
              ),
        });
      } catch (
        error
      ) {
        next(error);
      }
    };


  saturation =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        response.json({
          success: true,

          data:
            await this.service
              .getSaturationAlerts(
                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (
        error
      ) {
        next(error);
      }
    };


  redistribution =
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const {
          destinationId,
        } =
          destinationIdSchema.parse(
            request.query,
          );


        response.json({
          success: true,

          data:
            await this.service
              .getRedistribution(
                destinationId,

                parseFilters(
                  request.query,
                ),
              ),
        });
      } catch (
        error
      ) {
        next(error);
      }
    };

}
