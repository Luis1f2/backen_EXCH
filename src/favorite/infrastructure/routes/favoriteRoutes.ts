import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { AddFavoriteController } from "../controller/AddFavoriteController.js";
import type { ListMyFavoritesController } from "../controller/ListMyFavoritesController.js";
import type { RemoveFavoriteController } from "../controller/RemoveFavoriteController.js";

interface FavoriteControllers {
  add: AddFavoriteController;
  listMine: ListMyFavoritesController;
  remove: RemoveFavoriteController;
}

export function createFavoriteRoutes(
  controllers: FavoriteControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", authenticate, controllers.listMine.execute);
  router.post("/", authenticate, controllers.add.execute);

  router.delete(
    "/:targetType/:targetId",
    authenticate,
    controllers.remove.execute
  );

  return router;
}