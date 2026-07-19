import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";
import type { Pool } from "pg";

import { createAdminMiddleware } from "../../../http/middlewares/createAdminMiddleware.js";

import type { ListEventsController } from "../controller/ListEventsController.js";
import type { GetEventController } from "../controller/GetEventController.js";
import type { CreateEventController } from "../controller/CreateEventController.js";
import type { UpdateEventController } from "../controller/UpdateEventController.js";
import type { DeleteEventController } from "../controller/DeleteEventController.js";

interface EventControllers {
  list: ListEventsController;
  get: GetEventController;
  create: CreateEventController;
  update: UpdateEventController;
  delete: DeleteEventController;
}

export function createEventRoutes(
  controllers: EventControllers,
  pool: Pool,
  tokenService: TokenService
): Router {
  const router = Router();
  const adminOnly = createAdminMiddleware(pool, tokenService);

  router.get("/", controllers.list.execute);
  router.get("/:id", controllers.get.execute);

  router.post("/",      adminOnly, controllers.create.execute);
  router.patch("/:id",  adminOnly, controllers.update.execute);
  router.delete("/:id", adminOnly, controllers.delete.execute);

  return router;
}
