import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { ConversacionConMensajes } from "../../domain/entities/Conversacion.js";

export class ObtenerConversacion {
  constructor(private readonly repo: ChatRepository) {}

  async execute(id: string, usuarioId: string): Promise<ConversacionConMensajes | null> {
    return this.repo.obtenerConversacion(id, usuarioId);
  }
}
