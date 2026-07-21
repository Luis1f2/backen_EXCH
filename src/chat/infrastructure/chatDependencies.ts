import type { Pool } from "pg";
import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";
import { PgChatRepository } from "./PgChatRepository.js";
import { CrearConversacion } from "../application/usecase/CrearConversacion.js";
import { ListarConversaciones } from "../application/usecase/ListarConversaciones.js";
import { ObtenerConversacion } from "../application/usecase/ObtenerConversacion.js";
import { AgregarMensaje } from "../application/usecase/AgregarMensaje.js";
import {
  CrearConversacionController,
  ListarConversacionesController,
  ObtenerConversacionController,
  AgregarMensajeController,
  EliminarConversacionController,
} from "./controllers/ConversacionControllers.js";
import { createChatRoutes } from "./chatRoutes.js";

export function createChatModule(pool: Pool, jwtSecret: string) {
  const tokenService = new JwtTokenService(jwtSecret);
  const repo = new PgChatRepository(pool);

  const controllers = {
    crear:          new CrearConversacionController(new CrearConversacion(repo)),
    listar:         new ListarConversacionesController(new ListarConversaciones(repo)),
    obtener:        new ObtenerConversacionController(new ObtenerConversacion(repo)),
    agregarMensaje: new AgregarMensajeController(new AgregarMensaje(repo)),
    eliminar:       new EliminarConversacionController(repo),
  };

  return createChatRoutes(controllers, tokenService);
}
