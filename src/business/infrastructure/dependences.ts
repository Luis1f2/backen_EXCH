import type { Pool } from "pg";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateBusiness } from "../application/usecase/CreateBusiness.js";
import { GetBusiness } from "../application/usecase/GetBusiness.js";
import { ListBusinesses } from "../application/usecase/ListBusinesses.js";
import { ListMyBusinesses } from "../application/usecase/ListMyBusinesses.js";
import { UpdateBusiness } from "../application/usecase/UpdateBusiness.js";
import { DeleteBusiness } from "../application/usecase/DeleteBusiness.js";
import { ValidateBusiness } from "../application/usecase/ValidateBusiness.js";
import { GetBusinessSchedules } from "../application/usecase/GetBusinessSchedules.js";
import { ReplaceBusinessSchedules } from "../application/usecase/ReplaceBusinessSchedules.js";

import { ListBusinessServices } from "../application/usecase/ListBusinessServices.js";
import { CreateBusinessService } from "../application/usecase/CreateBusinessService.js";
import { UpdateBusinessService } from "../application/usecase/UpdateBusinessService.js";
import { DeleteBusinessService } from "../application/usecase/DeleteBusinessServices.js";

import { MySqlBusinessRepository } from "./mysql/MySqlBusinessRepository.js";
import { MySqlBusinessScheduleRepository } from "./mysql/MySqlBusinessScheduleRepository.js";
import { MySqlBusinessServiceRepository } from "./mysql/MySqlBusinessServiceRepository.js";
import { ListBusinessRequests } from "../application/usecase/ListBusinessRequests.js";

import { CreateBusinessController } from "./controller/CreateBusinessController.js";
import { GetBusinessController } from "./controller/GetBusinessController.js";
import { ListBusinessesController } from "./controller/ListBusinessesController.js";
import { ListMyBusinessesController } from "./controller/ListMyBusinessesController.js";
import { UpdateBusinessController } from "./controller/UpdateBusinessController.js";
import { DeleteBusinessController } from "./controller/DeleteBusinessController.js";
import { ValidateBusinessController } from "./controller/ValidateBusinessController.js";
import { GetBusinessSchedulesController } from "./controller/GetBusinessSchedulesController.js";
import { ReplaceBusinessSchedulesController } from "./controller/ReplaceBusinessSchedulesController.js";
import { ListBusinessRequestsController } from "./controller/ListBusinessRequestsController.js";

import { ListBusinessServicesController } from "./controller/ListBusinessServicesController.js";
import { CreateBusinessServiceController } from "./controller/CreateBusinessServiceController.js";
import { UpdateBusinessServiceController } from "./controller/UpdateBusinessServiceController.js";
import { DeleteBusinessServiceController } from "./controller/DeleteBusinessServiceController.js";

import { createBusinessRoutes } from "./routes/businessRoutes.js";

export function createBusinessModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository =
    new MySqlBusinessRepository(pool);

  const scheduleRepository =
    new MySqlBusinessScheduleRepository(pool);

  const serviceRepository =
    new MySqlBusinessServiceRepository(pool);

  const tokenService =
    new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateBusinessController(
      new CreateBusiness(repository)
    ),

   get: new GetBusinessController(
  new GetBusiness(
    repository,
    scheduleRepository
      )
    ),
    list: new ListBusinessesController(
      new ListBusinesses(repository)
    ),

    listMine: new ListMyBusinessesController(
      new ListMyBusinesses(repository)
    ),

    update: new UpdateBusinessController(
      new UpdateBusiness(repository)
    ),

    delete: new DeleteBusinessController(
      new DeleteBusiness(repository)
    ),

    validate:
  new ValidateBusinessController(
    new ValidateBusiness(pool),
  ),

listRequests:
  new ListBusinessRequestsController(
    new ListBusinessRequests(pool),
  ),

    getSchedules:
      new GetBusinessSchedulesController(
        new GetBusinessSchedules(
          scheduleRepository,
          repository
        )
      ),

    replaceSchedules:
      new ReplaceBusinessSchedulesController(
        new ReplaceBusinessSchedules(
          scheduleRepository,
          repository
        )
      ),

    listServices:
      new ListBusinessServicesController(
        new ListBusinessServices(
          serviceRepository,
          repository
        )
      ),

    createService:
      new CreateBusinessServiceController(
        new CreateBusinessService(
          serviceRepository,
          repository
        )
      ),

    updateService:
      new UpdateBusinessServiceController(
        new UpdateBusinessService(
          serviceRepository,
          repository
        )
      ),

    deleteService:
      new DeleteBusinessServiceController(
        new DeleteBusinessService(
          serviceRepository,
          repository
        )
      )
  };

  return createBusinessRoutes(
    controllers,
    tokenService,
    pool
  );
}