import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";
import type { CrearConversacion } from "../../application/usecase/CrearConversacion.js";
import type { ListarConversaciones } from "../../application/usecase/ListarConversaciones.js";
import type { ObtenerConversacion } from "../../application/usecase/ObtenerConversacion.js";
import type { AgregarMensaje } from "../../application/usecase/AgregarMensaje.js";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

// ── POST /conversaciones ───────────────────────────────────
export class CrearConversacionController {
  constructor(private readonly uc: CrearConversacion) {}

  execute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { titulo } = z.object({ titulo: z.string().max(200).optional() })
        .parse(req.body);
      const conv = await this.uc.execute(req.userId, titulo);
      res.status(201).json({ success: true, data: conv });
    } catch (e) { next(e); }
  };
}

// ── GET /conversaciones ────────────────────────────────────
export class ListarConversacionesController {
  constructor(private readonly uc: ListarConversaciones) {}

  execute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const lista = await this.uc.execute(req.userId);
      res.json({ success: true, data: lista });
    } catch (e) { next(e); }
  };
}

// ── GET /conversaciones/:id ────────────────────────────────
export class ObtenerConversacionController {
  constructor(private readonly uc: ObtenerConversacion) {}

  execute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conv = await this.uc.execute(req.params.id, req.userId);
      if (!conv) throw new AppError("Conversación no encontrada", 404);
      res.json({ success: true, data: conv });
    } catch (e) { next(e); }
  };
}

// ── POST /conversaciones/:id/mensajes ─────────────────────
export class AgregarMensajeController {
  constructor(private readonly uc: AgregarMensaje) {}

  execute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { rol, contenido } = z.object({
        rol:      z.enum(["user", "bot"]),
        contenido: z.string().min(1).max(5000),
      }).parse(req.body);
      const msg = await this.uc.execute(req.params.id, rol, contenido);
      res.status(201).json({ success: true, data: msg });
    } catch (e) { next(e); }
  };
}

// ── DELETE /conversaciones/:id ────────────────────────────
export class EliminarConversacionController {
  constructor(private readonly repo: ChatRepository) {}

  execute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ok = await this.repo.eliminarConversacion(req.params.id, req.userId);
      if (!ok) throw new AppError("Conversación no encontrada", 404);
      res.json({ success: true });
    } catch (e) { next(e); }
  };
}
