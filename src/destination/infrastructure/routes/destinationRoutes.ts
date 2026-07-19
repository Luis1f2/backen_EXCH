import { Router } from "express";

import type { Pool } from "pg";
import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createRoleMiddleware } from "../../../http/middlewares/createRoleMiddleware.js";

import type { CreateDestinationController } from "../controller/CreateDestinationController.js";
import type { GetDestinationController } from "../controller/GetDestinationController.js";
import type { ListDestinationsController } from "../controller/ListDestinationsController.js";
import type { UpdateDestinationController } from "../controller/UpdateDestinationController.js";
import type { DeleteDestinationController } from "../controller/DeleteDestinationController.js";

interface DestinationControllers {
  create: CreateDestinationController;
  get: GetDestinationController;
  list: ListDestinationsController;
  update: UpdateDestinationController;
  delete: DeleteDestinationController;
}

export function createDestinationRoutes(
  controllers: DestinationControllers,
  pool: Pool,
  tokenService: TokenService,
): Router {
  const router = Router();

  const platformAdminOnly = createRoleMiddleware(
    pool,
    tokenService,
    ["admin_plataforma"],
  );

  // Consultas públicas.
  router.get(
    "/",
    controllers.list.execute,
  );

  router.get(
    "/:id",
    controllers.get.execute,
  );

  // Solo el administrador de la plataforma
  // puede registrar destinos.
  router.post(
    "/",
    platformAdminOnly,
    controllers.create.execute,
  );

  // Solo el administrador de la plataforma
  // puede editar destinos.
  router.patch(
    "/:id",
    platformAdminOnly,
    controllers.update.execute,
  );

  // Solo el administrador de la plataforma
  // puede eliminar destinos.
  router.delete(
    "/:id",
    platformAdminOnly,
    controllers.delete.execute,
  );

  return router;
}