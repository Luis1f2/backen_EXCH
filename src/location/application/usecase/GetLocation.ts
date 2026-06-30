import type { Location } from "../../domain/entities/Location.js";
import type { LocationRepository } from "../../domain/repositories/LocationRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class GetLocation {
  constructor(private readonly repository: LocationRepository) {}

  async execute(id: string): Promise<Location> {
    const location = await this.repository.findById(id);

    if (!location) {
      throw new AppError("Ubicación no encontrada", 404);
    }

    return location;
  }
}