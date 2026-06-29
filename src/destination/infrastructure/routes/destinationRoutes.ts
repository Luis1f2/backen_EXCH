import { Router } from "express";

import type { TokenService } from "../../../user/applications/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

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
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", controllers.list.execute);
  router.get("/:id", controllers.get.execute);

  router.post("/", authenticate, controllers.create.execute);
  router.patch("/:id", authenticate, controllers.update.execute);
  router.delete("/:id", authenticate, controllers.delete.execute);

  return router;
}