import type { Destination } from "../../domain/entities/Destination.js";
import type { DestinationRepository } from "../../domain/repositories/DestinationRepository.js";
import { AppError } from "../../../user/applications/errors/AppError.js";

export class GetDestination {
  constructor(private readonly repository: DestinationRepository) {}

  async execute(id: string): Promise<Destination> {
    const destination = await this.repository.findById(id);

    if (!destination) {
      throw new AppError("Destino no encontrado", 404);
    }

    return destination;
  }
}