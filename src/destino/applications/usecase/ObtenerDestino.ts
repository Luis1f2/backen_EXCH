import type { Destino } from "../../domain/entities/Destino.js";
import type { DestinoRepository } from "../../domain/repositories/DestinoRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class ObtenerDestino {
  constructor(private readonly repository: DestinoRepository) {}

  async execute(id: string): Promise<Destino> {
    const destino = await this.repository.obtenerPorId(id);

    if (!destino) {
      throw new AppError("Destino no encontrado", 404);
    }

    return destino;
  }
}
