import type { Pool } from "pg";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateRoute } from "../application/usecase/CreateRoute.js";
import { GetRoute } from "../application/usecase/GetRoute.js";
import { ListRoutes } from "../application/usecase/ListRoutes.js";
import { ListMyRoutes } from "../application/usecase/ListMyRoutes.js";
import { UpdateRoute } from "../application/usecase/UpdateRoute.js";
import { DeleteRoute } from "../application/usecase/DeleteRoute.js";

import { MySqlRouteRepository } from "./mysql/MySqlRouteRepository.js";

import { CreateRouteController } from "./controller/CreateRouteController.js";
import { GetRouteController } from "./controller/GetRouteController.js";
import { ListRoutesController } from "./controller/ListRoutesController.js";
import { ListMyRoutesController } from "./controller/ListMyRoutesController.js";
import { UpdateRouteController } from "./controller/UpdateRouteController.js";
import { DeleteRouteController } from "./controller/DeleteRouteController.js";

import { createRouteRoutes } from "./routes/routeRoutes.js";

export function createRouteModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlRouteRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateRouteController(
      new CreateRoute(repository)
    ),
    get: new GetRouteController(
      new GetRoute(repository)
    ),
    list: new ListRoutesController(
      new ListRoutes(repository)
    ),
    listMine: new ListMyRoutesController(
      new ListMyRoutes(repository)
    ),
    update: new UpdateRouteController(
      new UpdateRoute(repository)
    ),
    delete: new DeleteRouteController(
      new DeleteRoute(repository)
    )
  };

  return createRouteRoutes(controllers, tokenService);
}