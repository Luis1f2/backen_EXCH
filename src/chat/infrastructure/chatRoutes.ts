import { Router } from "express";
import { createAuthenticateMiddleware } from "../../http/middlewares/createAuthenticateMiddleware.js";
import type { TokenService } from "../../user/application/ports/SecurityPorts.js";
import type {
  CrearConversacionController,
  ListarConversacionesController,
  ObtenerConversacionController,
  AgregarMensajeController,
  EliminarConversacionController,
} from "./controllers/ConversacionControllers.js";

interface ChatControllers {
  crear: CrearConversacionController;
  listar: ListarConversacionesController;
  obtener: ObtenerConversacionController;
  agregarMensaje: AgregarMensajeController;
  eliminar: EliminarConversacionController;
}

export function createChatRoutes(
  c: ChatControllers,
  tokenService: TokenService,
): Router {
  const router = Router();
  const auth = createAuthenticateMiddleware(tokenService);

  router.post("/conversaciones",              auth, c.crear.execute);
  router.get("/conversaciones",               auth, c.listar.execute);
  router.get("/conversaciones/:id",           auth, c.obtener.execute);
  router.post("/conversaciones/:id/mensajes", auth, c.agregarMensaje.execute);
  router.delete("/conversaciones/:id",        auth, c.eliminar.execute);

  return router;
}
