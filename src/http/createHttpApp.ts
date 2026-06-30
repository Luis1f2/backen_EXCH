import express, {
  type ErrorRequestHandler,
  type Express
} from "express";

import type { Pool } from "mysql2/promise";
import { ZodError } from "zod";

import { AppError } from "../user/application/errors/AppError.js";
import { createUserModule } from "../user/infrastructure/dependences.js";
import { createLocationModule } from "../location/infrastructure/dependences.js";
import { createDestinationModule } from "../destination/infrastructure/dependences.js";
import { createBusinessModule } from "../business/infrastructure/dependences.js";
import { createReviewModule } from "../review/infrastructure/dependences.js";
import { createAlertModule } from "../alert/infrastructure/dependences.js";
import { createRouteModule } from "../route/infrastructure/dependences.js";
import { createFavoriteModule } from "../favorite/infrastructure/dependences.js";


export function createHttpApp(
  databasePool: Pool,
  jwtSecret: string,
): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/v1/api/health", async (_request, response) => {
    await databasePool.query("SELECT 1");

    response.status(200).json({
      success: true,
      message: "ExploraChiapas API funcionando",
      database: "connected"
    });
  });

  app.use(
    "/v1/api/users",
    createUserModule(
      databasePool,
      jwtSecret
    )
  );

  app.use(
  "/v1/api/routes",
  createRouteModule(databasePool, jwtSecret)
  );

  app.use(
  "/v1/api/favorites",
  createFavoriteModule(databasePool, jwtSecret)
  );

  app.use(
  "/v1/api/alerts",
  createAlertModule(databasePool, jwtSecret)
  );

  app.use(
  "/v1/api/locations",
  createLocationModule(databasePool, jwtSecret)
  );

  app.use(
  "/v1/api/reviews",
  createReviewModule(databasePool, jwtSecret)
  );

  app.use(
  "/v1/api/destinations",
  createDestinationModule(databasePool, jwtSecret)
  );

  app.use(
  "/v1/api/businesses",
  createBusinessModule(databasePool, jwtSecret)
  );

    app.use((_request, response) => {
    response.status(404).json({
      success: false,
      message: "Ruta no encontrada"
    });
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next
  ): void => {
    if (error instanceof ZodError) {
      response.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.issues
      });
      return;
    }

    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      response.status(409).json({
        success: false,
        message: "El correo ya está registrado"
      });
      return;
    }

    console.error(error);

    response.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  };

  app.use(errorHandler);

  return app;
}