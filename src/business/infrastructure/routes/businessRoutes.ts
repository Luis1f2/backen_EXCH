import { Router } from "express";

import type { Pool } from "mysql2/promise";
import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";
import { createRoleMiddleware } from "../../../http/middlewares/createRoleMiddleware.js";

import type { CreateBusinessController } from "../controller/CreateBusinessController.js";
import type { GetBusinessController } from "../controller/GetBusinessController.js";
import type { ListBusinessesController } from "../controller/ListBusinessesController.js";
import type { ListMyBusinessesController } from "../controller/ListMyBusinessesController.js";
import type { UpdateBusinessController } from "../controller/UpdateBusinessController.js";
import type { DeleteBusinessController } from "../controller/DeleteBusinessController.js";
import type { ValidateBusinessController } from "../controller/ValidateBusinessController.js";
import type { GetBusinessSchedulesController } from "../controller/GetBusinessSchedulesController.js";
import type { ReplaceBusinessSchedulesController } from "../controller/ReplaceBusinessSchedulesController.js";

interface BusinessControllers {
  create: CreateBusinessController;
  get: GetBusinessController;
  list: ListBusinessesController;
  listMine: ListMyBusinessesController;
  update: UpdateBusinessController;
  delete: DeleteBusinessController;
  validate: ValidateBusinessController;
  getSchedules: GetBusinessSchedulesController;
  replaceSchedules: ReplaceBusinessSchedulesController;
}

export function createBusinessRoutes(
  controllers: BusinessControllers,
  tokenService: TokenService,
  pool: Pool,
): Router {
  const router = Router();

  const authenticate =
    createAuthenticateMiddleware(tokenService);

  const businessAdminOnly = createRoleMiddleware(
    pool,
    tokenService,
    ["admin_negocio"],
  );

  const platformAdminOnly = createRoleMiddleware(
    pool,
    tokenService,
    ["admin_plataforma"],
  );

  // Consulta pública.
  router.get(
    "/",
    controllers.list.execute,
  );

  // Negocios pertenecientes al administrador autenticado.
  router.get(
    "/mine",
    businessAdminOnly,
    controllers.listMine.execute,
  );

  // Consultar horarios.
  router.get(
    "/:id/schedules",
    authenticate,
    controllers.getSchedules.execute,
  );

  // Modificar horarios: rol + propiedad dentro del caso de uso.
  router.put(
    "/:id/schedules",
    businessAdminOnly,
    controllers.replaceSchedules.execute,
  );

  // Consulta pública del detalle.
  router.get(
    "/:id",
    controllers.get.execute,
  );

  // Registrar negocio.
  router.post(
    "/",
    businessAdminOnly,
    controllers.create.execute,
  );

  // Editar negocio: rol + propiedad.
  router.patch(
    "/:id",
    businessAdminOnly,
    controllers.update.execute,
  );

  // Eliminar/desactivar negocio: rol + propiedad.
  router.delete(
    "/:id",
    businessAdminOnly,
    controllers.delete.execute,
  );

  // Aprobar o rechazar negocio.
  router.patch(
    "/:id/validate",
    platformAdminOnly,
    controllers.validate.execute,
  );

  return router;
}