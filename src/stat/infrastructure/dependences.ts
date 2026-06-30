import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { GetBusinessStats } from "../application/usecase/GetBusinessStats.js";
import { GetSystemStats } from "../application/usecase/GetSystemStats.js";

import { GetBusinessStatsController } from "./controller/GetBusinessStatsController.js";
import { GetSystemStatsController } from "./controller/GetSystemStatsController.js";

import { createStatRoutes } from "./routes/statRoutes.js";

export function createStatModule(pool: Pool, jwtSecret: string) {
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    businessStats: new GetBusinessStatsController(new GetBusinessStats(pool)),
    systemStats: new GetSystemStatsController(new GetSystemStats(pool))
  };

  return createStatRoutes(controllers, pool, tokenService);
}
