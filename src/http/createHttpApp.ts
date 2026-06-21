import express, {
  type ErrorRequestHandler,
  type Express
} from "express";

import type { Pool } from "mysql2/promise";

import { createUserModule } from "../user/infrastructure/dependences.js";

export function createHttpApp(
  databasePool: Pool,
  jwtSecret: string
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
    createUserModule(databasePool, jwtSecret)
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
  ) => {
    console.error(error);

    response.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  };

  app.use(errorHandler);

  return app;
}