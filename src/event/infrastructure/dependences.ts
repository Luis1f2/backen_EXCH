import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { ListEvents } from "../application/usecase/ListEvents.js";
import { GetEvent } from "../application/usecase/GetEvent.js";
import { CreateEvent } from "../application/usecase/CreateEvent.js";
import { UpdateEvent } from "../application/usecase/UpdateEvent.js";
import { DeleteEvent } from "../application/usecase/DeleteEvent.js";

import { MySqlEventRepository } from "./mysql/MySqlEventRepository.js";

import { ListEventsController } from "./controller/ListEventsController.js";
import { GetEventController } from "./controller/GetEventController.js";
import { CreateEventController } from "./controller/CreateEventController.js";
import { UpdateEventController } from "./controller/UpdateEventController.js";
import { DeleteEventController } from "./controller/DeleteEventController.js";

import { createEventRoutes } from "./routes/eventRoutes.js";

export function createEventModule(pool: Pool, jwtSecret: string) {
  const repository = new MySqlEventRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    list: new ListEventsController(new ListEvents(repository)),
    get: new GetEventController(new GetEvent(repository)),
    create: new CreateEventController(new CreateEvent(repository)),
    update: new UpdateEventController(new UpdateEvent(repository)),
    delete: new DeleteEventController(new DeleteEvent(repository))
  };

  return createEventRoutes(controllers, pool, tokenService);
}
