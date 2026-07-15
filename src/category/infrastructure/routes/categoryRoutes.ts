import { Router } from "express";

import type { Pool } from "mysql2/promise";
import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAdminMiddleware } from "../../../http/middlewares/createAdminMiddleware.js";

import type { ListCategoriesController } from "../controller/ListCategoriesController.js";
import type { GetCategoryController } from "../controller/GetCategoryController.js";
import type { CreateCategoryController } from "../controller/CreateCategoryController.js";
import type { UpdateCategoryController } from "../controller/UpdateCategoryController.js";
import type { DeleteCategoryController } from "../controller/DeleteCategoryController.js";

interface CategoryControllers {
  list: ListCategoriesController;
  get: GetCategoryController;
  create: CreateCategoryController;
  update: UpdateCategoryController;
  delete: DeleteCategoryController;
}

export function createCategoryRoutes(
  controllers: CategoryControllers,
  pool: Pool,
  tokenService: TokenService,
): Router {
  const router = Router();

  const adminOnly =
    createAdminMiddleware(
      pool,
      tokenService,
    );

  router.get(
    "/",
    controllers.list.execute,
  );

  router.get(
    "/:id",
    controllers.get.execute,
  );

  router.post(
    "/",
    adminOnly,
    controllers.create.execute,
  );

  router.patch(
    "/:id",
    adminOnly,
    controllers.update.execute,
  );

  router.delete(
    "/:id",
    adminOnly,
    controllers.delete.execute,
  );

  return router;
}