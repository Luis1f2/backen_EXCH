import type {
  Pool,
} from "pg";

import {
  JwtTokenService,
} from "../../user/infrastructure/security/SecurityAdapters.js";

import {
  PremiumAnalyticsService,
} from "../application/PremiumAnalyticsService.js";

import {
  PremiumAnalyticsController,
} from "./controller/PremiumAnalyticsController.js";

import {
  createPremiumAnalyticsRoutes,
} from "./routes/premiumAnalyticsRoutes.js";


export function createPremiumAnalyticsModule(
  pool: Pool,

  jwtSecret: string,
) {
  const tokenService =
    new JwtTokenService(
      jwtSecret,
    );


  const service =
    new PremiumAnalyticsService(
      pool,
    );


  const controller =
    new PremiumAnalyticsController(
      service,
    );


  return createPremiumAnalyticsRoutes(
    controller,

    pool,

    tokenService,
  );
}
