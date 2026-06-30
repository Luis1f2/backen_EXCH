import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { CreateLocationController } from "../controller/CreateLocationController.js";
import type { GetLocationController } from "../controller/GetLocationController.js";
import type { ListLocationsController } from "../controller/ListLocationsController.js";
import type { UpdateLocationController } from "../controller/UpdateLocationController.js";

interface LocationControllers {
  create: CreateLocationController;
  get: GetLocationController;
  list: ListLocationsController;
  update: UpdateLocationController;
}

export function createLocationRoutes(
  controllers: LocationControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", controllers.list.execute);
  router.get("/:id", controllers.get.execute);

  router.post("/", authenticate, controllers.create.execute);
  router.patch("/:id", authenticate, controllers.update.execute);

  return router;
}