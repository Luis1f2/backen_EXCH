import { Router } from "express";

import type { ListarDestinosController } from "../controller/ListarDestinosController.js";
import type { ListarDestinosCercanosController } from "../controller/ListarDestinosCercanosController.js";
import type { ObtenerDestinoController } from "../controller/ObtenerDestinoController.js";

interface DestinoControllers {
  listar: ListarDestinosController;
  listarCercanos: ListarDestinosCercanosController;
  obtener: ObtenerDestinoController;
}

export function createDestinoRoutes(controllers: DestinoControllers): Router {
  const router = Router();

  // /cercanos debe registrarse antes de /:id, si no Express interpreta
  // "cercanos" como el valor del parametro id.
  router.get("/cercanos", controllers.listarCercanos.execute);
  router.get("/:id", controllers.obtener.execute);
  router.get("/", controllers.listar.execute);

  return router;
}
