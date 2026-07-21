import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { Conversacion } from "../../domain/entities/Conversacion.js";

export class CrearConversacion {
  constructor(private readonly repo: ChatRepository) {}

  async execute(usuarioId: string, titulo?: string): Promise<Conversacion> {
    return this.repo.crearConversacion(usuarioId, titulo);
  }
}
