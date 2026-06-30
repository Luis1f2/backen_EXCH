import type { Destino } from "../../domain/entities/Destino.js";

import type {
  BusquedaCercanos,
  DestinoRepository
} from "../../domain/repositories/DestinoRepository.js";

export class ListarDestinosCercanos {
  constructor(private readonly repository: DestinoRepository) {}

  async execute(busqueda: BusquedaCercanos): Promise<Destino[]> {
    return this.repository.listarCercanos(busqueda);
  }
}
