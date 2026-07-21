import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { MensajeChat } from "../../domain/entities/Conversacion.js";

export class AgregarMensaje {
  constructor(private readonly repo: ChatRepository) {}

  async execute(
    conversacionId: string,
    rol: "user" | "bot",
    contenido: string,
  ): Promise<MensajeChat> {
    return this.repo.agregarMensaje(conversacionId, rol, contenido);
  }
}
