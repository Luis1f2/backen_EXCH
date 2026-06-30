import type { Destino } from "../../domain/entities/Destino.js";
import type { DestinoRepository } from "../../domain/repositories/DestinoRepository.js";

export class ListarDestinos {
  constructor(private readonly repository: DestinoRepository) {}

  async execute(tipo?: string): Promise<Destino[]> {
    return this.repository.listar(tipo);
  }
}
