import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { CreateRouteController } from "../controller/CreateRouteController.js";
import type { GetRouteController } from "../controller/GetRouteController.js";
import type { ListRoutesController } from "../controller/ListRoutesController.js";
import type { ListMyRoutesController } from "../controller/ListMyRoutesController.js";
import type { UpdateRouteController } from "../controller/UpdateRouteController.js";
import type { DeleteRouteController } from "../controller/DeleteRouteController.js";

interface RouteControllers {
  create: CreateRouteController;
  get: GetRouteController;
  list: ListRoutesController;
  listMine: ListMyRoutesController;
  update: UpdateRouteController;
  delete: DeleteRouteController;
}

export function createRouteRoutes(
  controllers: RouteControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", controllers.list.execute);
  router.get("/mine", authenticate, controllers.listMine.execute);
  router.get("/:id", controllers.get.execute);

  router.post("/", authenticate, controllers.create.execute);
  router.patch("/:id", authenticate, controllers.update.execute);
  router.delete("/:id", authenticate, controllers.delete.execute);

  return router;
}