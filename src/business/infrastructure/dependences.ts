import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateBusiness } from "../application/usecase/CreateBusiness.js";
import { GetBusiness } from "../application/usecase/GetBusiness.js";
import { ListBusinesses } from "../application/usecase/ListBusinesses.js";
import { ListMyBusinesses } from "../application/usecase/ListMyBusinesses.js";
import { UpdateBusiness } from "../application/usecase/UpdateBusiness.js";
import { DeleteBusiness } from "../application/usecase/DeleteBusiness.js";

import { MySqlBusinessRepository } from "./mysql/MySqlBusinessRepository.js";

import { CreateBusinessController } from "./controller/CreateBusinessController.js";
import { GetBusinessController } from "./controller/GetBusinessController.js";
import { ListBusinessesController } from "./controller/ListBusinessesController.js";
import { ListMyBusinessesController } from "./controller/ListMyBusinessesController.js";
import { UpdateBusinessController } from "./controller/UpdateBusinessController.js";
import { DeleteBusinessController } from "./controller/DeleteBusinessController.js";

import { ValidateBusiness } from "../application/usecase/ValidateBusiness.js";
import { ValidateBusinessController } from "./controller/ValidateBusinessController.js";

import { createBusinessRoutes } from "./routes/businessRoutes.js";

export function createBusinessModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlBusinessRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateBusinessController(new CreateBusiness(repository)),
    get: new GetBusinessController(new GetBusiness(repository)),
    list: new ListBusinessesController(new ListBusinesses(repository)),
    listMine: new ListMyBusinessesController(new ListMyBusinesses(repository)),
    update: new UpdateBusinessController(new UpdateBusiness(repository)),
    delete: new DeleteBusinessController(new DeleteBusiness(repository)),
    validate: new ValidateBusinessController(new ValidateBusiness(pool))
  };

  return createBusinessRoutes(controllers, tokenService, pool);
}