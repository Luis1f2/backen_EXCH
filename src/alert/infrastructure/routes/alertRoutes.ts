import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import type { CreateAlertController } from "../controller/CreateAlertController.js";
import type { GetAlertController } from "../controller/GetAlertController.js";
import type { ListAlertsController } from "../controller/ListAlertsController.js";
import type { MarkAlertAsAttendedController } from "../controller/MarkAlertAsAttendedController.js";
import type { DiscardAlertController } from "../controller/DiscardAlertController.js";

interface AlertControllers {
  create: CreateAlertController;
  get: GetAlertController;
  list: ListAlertsController;
  attend: MarkAlertAsAttendedController;
  discard: DiscardAlertController;
}

export function createAlertRoutes(
  controllers: AlertControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.get("/", authenticate, controllers.list.execute);
  router.get("/:id", authenticate, controllers.get.execute);

  router.post("/", authenticate, controllers.create.execute);

  router.patch(
    "/:id/attend",
    authenticate,
    controllers.attend.execute
  );

  router.patch(
    "/:id/discard",
    authenticate,
    controllers.discard.execute
  );

  return router;
}