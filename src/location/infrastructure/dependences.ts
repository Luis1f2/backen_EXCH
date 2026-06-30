import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateLocation } from "../application/usecase/CreateLocation.js";
import { GetLocation } from "../application/usecase/GetLocation.js";
import { ListLocations } from "../application/usecase/ListLocations.js";
import { UpdateLocation } from "../application/usecase/UpdateLocation.js";

import { MySqlLocationRepository } from "./mysql/MySqlLocationRepository.js";

import { CreateLocationController } from "./controller/CreateLocationController.js";
import { GetLocationController } from "./controller/GetLocationController.js";
import { ListLocationsController } from "./controller/ListLocationsController.js";
import { UpdateLocationController } from "./controller/UpdateLocationController.js";

import { createLocationRoutes } from "./routes/locationRoutes.js";

export function createLocationModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlLocationRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateLocationController(
      new CreateLocation(repository)
    ),
    get: new GetLocationController(
      new GetLocation(repository)
    ),
    list: new ListLocationsController(
      new ListLocations(repository)
    ),
    update: new UpdateLocationController(
      new UpdateLocation(repository)
    )
  };

  return createLocationRoutes(controllers, tokenService);
}