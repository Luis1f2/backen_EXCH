import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { Conversacion } from "../../domain/entities/Conversacion.js";

export class ListarConversaciones {
  constructor(private readonly repo: ChatRepository) {}

  async execute(usuarioId: string): Promise<Conversacion[]> {
    return this.repo.listarConversaciones(usuarioId);
  }
}
