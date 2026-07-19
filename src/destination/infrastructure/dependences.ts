import type { Pool } from "pg";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateDestination } from "../application/usecase/CreateDestination.js";
import { GetDestination } from "../application/usecase/GetDestination.js";
import { ListDestinations } from "../application/usecase/ListDestinations.js";
import { UpdateDestination } from "../application/usecase/UpdateDestination.js";
import { DeleteDestination } from "../application/usecase/DeleteDestination.js";

import { MySqlDestinationRepository } from "./mysql/MySqlDestinationRepository.js";

import { CreateDestinationController } from "./controller/CreateDestinationController.js";
import { GetDestinationController } from "./controller/GetDestinationController.js";
import { ListDestinationsController } from "./controller/ListDestinationsController.js";
import { UpdateDestinationController } from "./controller/UpdateDestinationController.js";
import { DeleteDestinationController } from "./controller/DeleteDestinationController.js";

import { createDestinationRoutes } from "./routes/destinationRoutes.js";

export function createDestinationModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlDestinationRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateDestinationController(
      new CreateDestination(repository)
    ),
    get: new GetDestinationController(
      new GetDestination(repository)
    ),
    list: new ListDestinationsController(
      new ListDestinations(repository)
    ),
    update: new UpdateDestinationController(
      new UpdateDestination(repository)
    ),
    delete: new DeleteDestinationController(
      new DeleteDestination(repository)
    )
  };

  return createDestinationRoutes(controllers,pool ,tokenService);
}