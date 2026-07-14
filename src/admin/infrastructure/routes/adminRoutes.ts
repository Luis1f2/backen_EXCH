import { Router } from "express";

import type { Pool } from "mysql2/promise";
import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAdminMiddleware } from "../../../http/middlewares/createAdminMiddleware.js";

import type { ListUsersController } from "../controller/ListUsersController.js";
import type { UpdateUserStatusController } from "../controller/UpdateUserStatusController.js";
import type { DeleteUserController } from "../controller/DeleteUserController.js";

interface AdminControllers {
  listUsers: ListUsersController;
  updateUserStatus: UpdateUserStatusController;
  deleteUser: DeleteUserController;
}

export function createAdminRoutes(
  controllers: AdminControllers,
  pool: Pool,
  tokenService: TokenService,
): Router {
  const router = Router();

  const adminOnly =
    createAdminMiddleware(pool, tokenService);

  router.get(
    "/users",
    adminOnly,
    controllers.listUsers.execute,
  );

  router.patch(
    "/users/:id",
    adminOnly,
    controllers.updateUserStatus.execute,
  );

  router.delete(
    "/users/:id",
    adminOnly,
    controllers.deleteUser.execute,
  );

  return router;
}