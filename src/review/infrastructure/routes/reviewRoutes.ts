import { Router } from "express";

import type { TokenService } from "../../../user/applications/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { CreateReviewController } from "../controller/CreateReviewController.js";
import type { GetReviewController } from "../controller/GetReviewController.js";
import type { ListReviewsController } from "../controller/ListReviewsController.js";
import type { UpdateReviewController } from "../controller/UpdateReviewController.js";
import type { DeleteReviewController } from "../controller/DeleteReviewController.js";

interface ReviewControllers {
  create: CreateReviewController;
  get: GetReviewController;
  list: ListReviewsController;
  update: UpdateReviewController;
  delete: DeleteReviewController;
}

export function createReviewRoutes(
  controllers: ReviewControllers,
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