import type { Pool } from "pg";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateAlert } from "../application/usecase/CreateAlert.js";
import { GetAlert } from "../application/usecase/GetAlert.js";
import { ListAlerts } from "../application/usecase/ListAlerts.js";
import { MarkAlertAsAttended } from "../application/usecase/MarkAlertAsAttended.js";
import { DiscardAlert } from "../application/usecase/DiscardAlert.js";

import { MySqlAlertRepository } from "./mysql/MySqlAlertRepository.js";

import { CreateAlertController } from "./controller/CreateAlertController.js";
import { GetAlertController } from "./controller/GetAlertController.js";
import { ListAlertsController } from "./controller/ListAlertsController.js";
import { MarkAlertAsAttendedController } from "./controller/MarkAlertAsAttendedController.js";
import { DiscardAlertController } from "./controller/DiscardAlertController.js";

import { createAlertRoutes } from "./routes/alertRoutes.js";

export function createAlertModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlAlertRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateAlertController(
      new CreateAlert(repository)
    ),
    get: new GetAlertController(
      new GetAlert(repository)
    ),
    list: new ListAlertsController(
      new ListAlerts(repository)
    ),
    attend: new MarkAlertAsAttendedController(
      new MarkAlertAsAttended(repository)
    ),
    discard: new DiscardAlertController(
      new DiscardAlert(repository)
    )
  };

  return createAlertRoutes(controllers, tokenService);
}