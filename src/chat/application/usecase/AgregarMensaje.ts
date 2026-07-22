import { AppError } from "../../../user/application/errors/AppError.js";

import type {
  ChatRepository,
} from "../../domain/repositories/ChatRepository.js";

import type {
  MensajeChat,
} from "../../domain/entities/Conversacion.js";

export class AgregarMensaje {
  constructor(
    private readonly repo: ChatRepository,
  ) {}

  async execute(
    conversacionId: string,
    usuarioId: string,
    contenido: string,
  ): Promise<MensajeChat> {
    /*
     * Este endpoint es utilizado por un usuario
     * autenticado.
     *
     * El cliente nunca puede decidir que su
     * mensaje tiene rol "bot".
     */
    const mensaje =
      await this.repo.agregarMensaje(
        conversacionId,
        usuarioId,
        "user",
        contenido,
      );

    if (!mensaje) {
      /*
       * Devolvemos 404 tanto si no existe como si
       * pertenece a otro usuario.
       *
       * Así tampoco revelamos la existencia de
       * conversaciones ajenas.
       */
      throw new AppError(
        "Conversación no encontrada",
        404,
      );
    }

    return mensaje;
  }
}