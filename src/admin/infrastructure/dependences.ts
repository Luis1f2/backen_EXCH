import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { ListUsers } from "../application/usecase/ListUsers.js";
import { UpdateUserStatus } from "../application/usecase/UpdateUserStatus.js";

import { ListUsersController } from "./controller/ListUsersController.js";
import { UpdateUserStatusController } from "./controller/UpdateUserStatusController.js";

import { createAdminRoutes } from "./routes/adminRoutes.js";

export function createAdminModule(pool: Pool, jwtSecret: string) {
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    listUsers: new ListUsersController(new ListUsers(pool)),
    updateUserStatus: new UpdateUserStatusController(new UpdateUserStatus(pool))
  };

  return createAdminRoutes(controllers, pool, tokenService);
}
