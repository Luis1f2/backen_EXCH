import { Router } from "express";

import type { Pool } from "mysql2/promise";
import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";
import { createAdminMiddleware } from "../../../http/middlewares/createAdminMiddleware.js";

import type { GetBusinessStatsController } from "../controller/GetBusinessStatsController.js";
import type { GetSystemStatsController } from "../controller/GetSystemStatsController.js";

interface StatControllers {
  businessStats: GetBusinessStatsController;
  systemStats: GetSystemStatsController;
}

export function createStatRoutes(
  controllers: StatControllers,
  pool: Pool,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);
  const adminOnly = createAdminMiddleware(pool, tokenService);

  router.get("/businesses/:negocioId", authenticate, controllers.businessStats.execute);
  router.get("/system", adminOnly, controllers.systemStats.execute);

  return router;
}
