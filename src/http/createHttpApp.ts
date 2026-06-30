import express, {
  type ErrorRequestHandler,
  type Express
} from "express";

import type { Pool } from "mysql2/promise";
import { ZodError } from "zod";

import { AppError } from "../user/applications/errors/AppError.js";
import { createUserModule } from "../user/infrastructure/dependencies.js";
import { createDestinoModule } from "../destino/infrastructure/dependencies.js";
import { verifyDatabaseConnection } from "../database/databasePool.js";

export function createHttpApp(
  databasePool: Pool,
  jwtSecret: string,
): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/v1/api/health", async (_request, response) => {
    await verifyDatabaseConnection(databasePool);

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

  app.use("/v1/api/destinos", createDestinoModule(databasePool));

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