import { Router } from "express";

import type { Pool } from "pg";
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
import type { ListBusinessRequestsController } from "../controller/ListBusinessRequestsController.js";

import type { GetBusinessSchedulesController } from "../controller/GetBusinessSchedulesController.js";
import type { ReplaceBusinessSchedulesController } from "../controller/ReplaceBusinessSchedulesController.js";

import type { ListBusinessServicesController } from "../controller/ListBusinessServicesController.js";
import type { CreateBusinessServiceController } from "../controller/CreateBusinessServiceController.js";
import type { UpdateBusinessServiceController } from "../controller/UpdateBusinessServiceController.js";
import type { DeleteBusinessServiceController } from "../controller/DeleteBusinessServiceController.js";

interface BusinessControllers {
  create: CreateBusinessController;
  get: GetBusinessController;
  list: ListBusinessesController;
  listMine: ListMyBusinessesController;
  update: UpdateBusinessController;
  delete: DeleteBusinessController;
  validate: ValidateBusinessController;
  listRequests: ListBusinessRequestsController;

  getSchedules:
    GetBusinessSchedulesController;

  replaceSchedules:
    ReplaceBusinessSchedulesController;

  listServices:
    ListBusinessServicesController;

  createService:
    CreateBusinessServiceController;

  updateService:
    UpdateBusinessServiceController;

  deleteService:
    DeleteBusinessServiceController;
}

export function createBusinessRoutes(
  controllers: BusinessControllers,
  tokenService: TokenService,
  pool: Pool,
): Router {
  const router = Router();

  const authenticate =
    createAuthenticateMiddleware(
      tokenService,
    );

  const businessAdminOnly =
    createRoleMiddleware(
      pool,
      tokenService,
      ["admin_negocio"],
    );

  const platformAdminOnly =
    createRoleMiddleware(
      pool,
      tokenService,
      ["admin_plataforma"],
    );

  /*
   * IMPORTANTE:
   * Las rutas fijas deben declararse antes
   * de las rutas dinámicas como /:id.
   */

  // Solicitudes para admin de plataforma.
  router.get(
    "/admin/requests",
    platformAdminOnly,
    controllers.listRequests.execute,
  );

  // Negocios del administrador autenticado.
  router.get(
    "/mine",
    businessAdminOnly,
    controllers.listMine.execute,
  );

  // Listado público de negocios verificados.
  router.get(
    "/",
    controllers.list.execute,
  );

  /*
   * Horarios
   */

  router.get(
    "/:id/schedules",
    authenticate,
    controllers.getSchedules.execute,
  );

  router.put(
    "/:id/schedules",
    businessAdminOnly,
    controllers.replaceSchedules.execute,
  );

  /*
   * Servicios
   */

  // Consulta pública de servicios.
  router.get(
    "/:id/services",
    controllers.listServices.execute,
  );

  // Crear servicio.
  router.post(
    "/:id/services",
    businessAdminOnly,
    controllers.createService.execute,
  );

  // Editar servicio.
  router.patch(
    "/:id/services/:serviceId",
    businessAdminOnly,
    controllers.updateService.execute,
  );

  // Eliminar/desactivar servicio.
  router.delete(
    "/:id/services/:serviceId",
    businessAdminOnly,
    controllers.deleteService.execute,
  );

  /*
   * Negocios
   */

  // Registrar negocio.
  router.post(
    "/",
    businessAdminOnly,
    controllers.create.execute,
  );

  // Aprobar o rechazar negocio.
  router.patch(
    "/:id/validate",
    platformAdminOnly,
    controllers.validate.execute,
  );

  // Detalle público del negocio.
  router.get(
    "/:id",
    controllers.get.execute,
  );

  // Editar negocio propio.
  router.patch(
    "/:id",
    businessAdminOnly,
    controllers.update.execute,
  );

  // Eliminar/desactivar negocio propio.
  router.delete(
    "/:id",
    businessAdminOnly,
    controllers.delete.execute,
  );

  return router;
}