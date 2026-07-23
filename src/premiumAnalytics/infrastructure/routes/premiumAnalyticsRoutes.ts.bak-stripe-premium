import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import type {
  Pool,
} from "pg";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import type {
  TokenService,
} from "../../../user/application/ports/SecurityPorts.js";

import type {
  AuthenticatedRequest,
} from "../../../http/middlewares/AuthenticatedRequest.js";

import {
  createRoleMiddleware,
} from "../../../http/middlewares/createRoleMiddleware.js";

import type {
  PremiumAnalyticsController,
} from "../controller/PremiumAnalyticsController.js";


export function createPremiumAnalyticsRoutes(
  controller:
    PremiumAnalyticsController,

  pool: Pool,

  tokenService:
    TokenService,
): Router {
  const router =
    Router();


  /*
   * Más adelante Stripe se añadirá como una capa
   * adicional de autorización Premium.
   *
   * Por ahora únicamente restringimos las consultas
   * analíticas a admin_negocio.
   */
  const platformAdminOnly =
    createRoleMiddleware(
      pool,
      tokenService,
      [
        "admin_plataforma",
      ],
    );


  const businessAdminOnly =
    createRoleMiddleware(
      pool,
      tokenService,
      [
        "admin_negocio",
      ],
    );


  /*
   * Autenticación opcional para eventos analíticos.
   *
   * Sin token:
   * evento anónimo.
   *
   * Con token válido:
   * guardamos usuario_id.
   *
   * Con token inválido:
   * rechazamos la petición.
   */
  const optionalAuthenticate =
    (
      request: Request,
      _response: Response,
      next: NextFunction,
    ): void => {
      try {
        const authorization =
          request.headers
            .authorization;


        if (!authorization) {
          next();

          return;
        }


        if (
          !authorization
            .startsWith(
              "Bearer ",
            )
        ) {
          throw new AppError(
            "Token inválido",
            401,
          );
        }


        const token =
          authorization
            .slice(7)
            .trim();


        if (!token) {
          throw new AppError(
            "Token inválido",
            401,
          );
        }


        (
          request as
            AuthenticatedRequest
        ).userId =
          tokenService.verify(
            token,
          );


        next();
      } catch (
        error
      ) {
        next(error);
      }
    };


  /*
   * Captura de comportamiento.
   */
  router.post(
    "/events",

    optionalAuthenticate,

    controller.recordEvent,
  );


  /*
   * Inteligencia Premium.
   */
  router.get(
    "/summary",

    businessAdminOnly,

    controller.report,
  );


  router.get(
    "/reports",

    businessAdminOnly,

    controller.report,
  );


  router.get(
    "/trends",

    businessAdminOnly,

    controller.trends,
  );


  router.get(
    "/rankings/destinations",

    businessAdminOnly,

    controller.rankings,
  );


  router.get(
    "/heatmap",

    businessAdminOnly,

    controller.heatmap,
  );


  /*
   * Configuración institucional de capacidad.
   */
  router.put(
    "/sustainability/capacity/:destinationId",

    platformAdminOnly,

    controller.saveDestinationCapacity,
  );


  /*
   * Inteligencia Premium de sostenibilidad.
   */
  router.get(
    "/sustainability/saturation",

    businessAdminOnly,

    controller.saturation,
  );


  router.get(
    "/sustainability/redistribution",

    businessAdminOnly,

    controller.redistribution,
  );


  return router;
}
