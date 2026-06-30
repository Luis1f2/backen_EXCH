import type { DestinationRepository } from "../../domain/repositories/DestinationRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class DeleteDestination {
  constructor(private readonly repository: DestinationRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Destino no encontrado", 404);
    }
  }
}