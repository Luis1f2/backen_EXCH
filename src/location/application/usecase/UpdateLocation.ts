import type { Location } from "../../domain/entities/Location.js";

import type {
  LocationRepository,
  UpdateLocationData
} from "../../domain/repositories/LocationRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface UpdateLocationInput {
  latitude?: number;
  longitude?: number;
  address?: string | null;
  municipality?: string | null;
  state?: string | null;
  mapProvider?: string | null;
  providerPlaceId?: string | null;
}

export class UpdateLocation {
  constructor(private readonly repository: LocationRepository) {}

  async execute(
    userId: string,
    locationId: string,
    input: UpdateLocationInput
  ): Promise<Location> {
    const location = await this.repository.findById(locationId);

    if (!location) {
      throw new AppError("Ubicación no encontrada", 404);
    }

    if (location.createdByUserId !== userId) {
      throw new AppError("No tienes permisos para modificar esta ubicación", 403);
    }

    const reviewStatusId =
      await this.repository.findReviewStatusIdByName("pendiente");

    if (!reviewStatusId) {
      throw new AppError("Estado de revisión no encontrado", 500);
    }

    const updateData: UpdateLocationData = {
      reviewStatusId
    };

    if (input.latitude !== undefined) {
      updateData.latitude = input.latitude;
    }

    if (input.longitude !== undefined) {
      updateData.longitude = input.longitude;
    }

    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    if (input.municipality !== undefined) {
      updateData.municipality = input.municipality;
    }

    if (input.state !== undefined) {
      updateData.state = input.state;
    }

    if (input.mapProvider !== undefined) {
      updateData.mapProvider = input.mapProvider;
    }

    if (input.providerPlaceId !== undefined) {
      updateData.providerPlaceId = input.providerPlaceId;
    }

    const updatedLocation = await this.repository.update(
      locationId,
      updateData
    );

    if (!updatedLocation) {
      throw new AppError("No se pudo actualizar la ubicación", 500);
    }

    return updatedLocation;
  }
}