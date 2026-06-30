import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { ListPromotionsController } from "../controller/ListPromotionsController.js";
import type { CreatePromotionController } from "../controller/CreatePromotionController.js";
import type { UpdatePromotionController } from "../controller/UpdatePromotionController.js";
import type { DeletePromotionController } from "../controller/DeletePromotionController.js";

interface PromotionControllers {
  list: ListPromotionsController;
  create: CreatePromotionController;
  update: UpdatePromotionController;
  delete: DeletePromotionController;
}

export function createPromotionRoutes(
  controllers: PromotionControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", controllers.list.execute);

  router.post("/",      authenticate, controllers.create.execute);
  router.patch("/:id",  authenticate, controllers.update.execute);
  router.delete("/:id", authenticate, controllers.delete.execute);

  return router;
}
