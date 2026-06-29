import { randomUUID } from "node:crypto";

import type { Destination } from "../../domain/entities/Destination.js";
import type { DestinationRepository } from "../../domain/repositories/DestinationRepository.js";
import { AppError } from "../../../user/applications/errors/AppError.js";

export interface CreateDestinationInput {
  name: string;
  description?: string | null;
  categoryName: string;
  locationId: string;
}

export class CreateDestination {
  constructor(private readonly repository: DestinationRepository) {}

  async execute(input: CreateDestinationInput): Promise<Destination> {
    const categoryId =
      await this.repository.findCategoryIdByName(input.categoryName);

    if (!categoryId) {
      throw new AppError("Categoría no encontrada", 400);
    }

    const locationExists =
      await this.repository.locationExists(input.locationId);

    if (!locationExists) {
      throw new AppError("Ubicación no encontrada", 400);
    }

    return this.repository.create({
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      categoryId,
      locationId: input.locationId
    });
  }
}