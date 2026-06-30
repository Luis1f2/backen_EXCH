import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { CreateBusinessController } from "../controller/CreateBusinessController.js";
import type { GetBusinessController } from "../controller/GetBusinessController.js";
import type { ListBusinessesController } from "../controller/ListBusinessesController.js";
import type { ListMyBusinessesController } from "../controller/ListMyBusinessesController.js";
import type { UpdateBusinessController } from "../controller/UpdateBusinessController.js";
import type { DeleteBusinessController } from "../controller/DeleteBusinessController.js";
import type { ValidateBusinessController } from "../controller/ValidateBusinessController.js";
import { createAdminMiddleware } from "../../../http/middlewares/createAdminMiddleware.js";
import type { Pool } from "mysql2/promise";

interface BusinessControllers {
  create: CreateBusinessController;
  get: GetBusinessController;
  list: ListBusinessesController;
  listMine: ListMyBusinessesController;
  update: UpdateBusinessController;
  delete: DeleteBusinessController;
  validate: ValidateBusinessController;
}

export function createBusinessRoutes(
  controllers: BusinessControllers,
  tokenService: TokenService,
  pool?: Pool
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", controllers.list.execute);
  router.get("/mine", authenticate, controllers.listMine.execute);
  router.get("/:id", controllers.get.execute);

  router.post("/", authenticate, controllers.create.execute);
  router.patch("/:id", authenticate, controllers.update.execute);
  router.delete("/:id", authenticate, controllers.delete.execute);

  if (pool) {
    const adminOnly = createAdminMiddleware(pool, tokenService);
    router.patch("/:id/validate", adminOnly, controllers.validate.execute);
  }

  return router;
}