import type { Destination } from "../../domain/entities/Destination.js";

import type {
  DestinationRepository,
  UpdateDestinationData
} from "../../domain/repositories/DestinationRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface UpdateDestinationInput {
  name?: string;
  description?: string | null;
  categoryName?: string;
  locationId?: string;
}

export class UpdateDestination {
  constructor(private readonly repository: DestinationRepository) {}

  async execute(
    id: string,
    input: UpdateDestinationInput
  ): Promise<Destination> {
    const destination = await this.repository.findById(id);

    if (!destination) {
      throw new AppError("Destino no encontrado", 404);
    }

    const updateData: UpdateDestinationData = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.categoryName !== undefined) {
      const categoryId =
        await this.repository.findCategoryIdByName(input.categoryName);

      if (!categoryId) {
        throw new AppError("Categoría no encontrada", 400);
      }

      updateData.categoryId = categoryId;
    }

    if (input.locationId !== undefined) {
      const locationExists =
        await this.repository.locationExists(input.locationId);

      if (!locationExists) {
        throw new AppError("Ubicación no encontrada", 400);
      }

      updateData.locationId = input.locationId;
    }

    const updatedDestination = await this.repository.update(
      id,
      updateData
    );

    if (!updatedDestination) {
      throw new AppError("No se pudo actualizar el destino", 500);
    }

    return updatedDestination;
  }
}