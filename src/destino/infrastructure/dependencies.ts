import type { Pool } from "pg";

import { ListarDestinos } from "../applications/usecase/ListarDestinos.js";
import { ListarDestinosCercanos } from "../applications/usecase/ListarDestinosCercanos.js";
import { ObtenerDestino } from "../applications/usecase/ObtenerDestino.js";

import { MySqlDestinoRepository } from "./Mysql/MySqlDestinoRepository.js";

import { ListarDestinosController } from "./controller/ListarDestinosController.js";
import { ListarDestinosCercanosController } from "./controller/ListarDestinosCercanosController.js";
import { ObtenerDestinoController } from "./controller/ObtenerDestinoController.js";

import { createDestinoRoutes } from "./routes/DestinoRoutes.js";

export function createDestinoModule(pool: Pool) {
  const repository = new MySqlDestinoRepository(pool);

  const controllers = {
    listar: new ListarDestinosController(new ListarDestinos(repository)),
    listarCercanos: new ListarDestinosCercanosController(
      new ListarDestinosCercanos(repository)
    ),
    obtener: new ObtenerDestinoController(new ObtenerDestino(repository))
  };

  return createDestinoRoutes(controllers);
}
