import { Router } from "express";

import type { Pool } from "pg";
import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createRoleMiddleware } from "../../../http/middlewares/createRoleMiddleware.js";

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
  tokenService: TokenService,
  pool: Pool,
): Router {
  const router = Router();

  const businessAdminOnly = createRoleMiddleware(
    pool,
    tokenService,
    ["admin_negocio"],
  );

  router.get(
    "/",
    controllers.list.execute,
  );

  router.post(
    "/",
    businessAdminOnly,
    controllers.create.execute,
  );

  router.patch(
    "/:id",
    businessAdminOnly,
    controllers.update.execute,
  );

  router.delete(
    "/:id",
    businessAdminOnly,
    controllers.delete.execute,
  );

  return router;
}