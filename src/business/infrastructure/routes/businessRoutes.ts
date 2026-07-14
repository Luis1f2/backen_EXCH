import { Router } from "express";

import type { Pool } from "mysql2/promise";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import { createAdminMiddleware } from "../../../http/middlewares/createAdminMiddleware.js";

import type { CreateBusinessController } from "../controller/CreateBusinessController.js";
import type { GetBusinessController } from "../controller/GetBusinessController.js";
import type { ListBusinessesController } from "../controller/ListBusinessesController.js";
import type { ListMyBusinessesController } from "../controller/ListMyBusinessesController.js";
import type { UpdateBusinessController } from "../controller/UpdateBusinessController.js";
import type { DeleteBusinessController } from "../controller/DeleteBusinessController.js";
import type { ValidateBusinessController } from "../controller/ValidateBusinessController.js";
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
  getSchedules: GetBusinessSchedulesController;
  replaceSchedules: ReplaceBusinessSchedulesController;
  listServices: ListBusinessServicesController;
  createService: CreateBusinessServiceController;
  updateService: UpdateBusinessServiceController;
  deleteService: DeleteBusinessServiceController;
}

export function createBusinessRoutes(
  controllers: BusinessControllers,
  tokenService: TokenService,
  pool?: Pool
): Router {
  const router = Router();

  const authenticate =
    createAuthenticateMiddleware(tokenService);

  router.get(
    "/",
    controllers.list.execute
  );

  router.get(
    "/mine",
    authenticate,
    controllers.listMine.execute
  );

  router.get(
    "/:id/services",
    controllers.listServices.execute
  );

  router.post(
    "/:id/services",
    authenticate,
    controllers.createService.execute
  );

  router.patch(
    "/:id/services/:serviceId",
    authenticate,
    controllers.updateService.execute
  );

  router.delete(
    "/:id/services/:serviceId",
    authenticate,
    controllers.deleteService.execute
  );

  router.get(
    "/:id/schedules",
    authenticate,
    controllers.getSchedules.execute
  );

  router.put(
    "/:id/schedules",
    authenticate,
    controllers.replaceSchedules.execute
  );

  router.get(
    "/:id",
    controllers.get.execute
  );

  router.post(
    "/",
    authenticate,
    controllers.create.execute
  );

  router.patch(
    "/:id",
    authenticate,
    controllers.update.execute
  );

  router.delete(
    "/:id",
    authenticate,
    controllers.delete.execute
  );

  if (pool) {
    const adminOnly =
      createAdminMiddleware(
        pool,
        tokenService
      );

    router.patch(
      "/:id/validate",
      adminOnly,
      controllers.validate.execute
    );
  }

  return router;
}