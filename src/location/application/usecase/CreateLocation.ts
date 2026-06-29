import { randomUUID } from "node:crypto";

import type { Location } from "../../domain/entities/Location.js";
import type { LocationRepository } from "../../domain/repositories/LocationRepository.js";
import { AppError } from "../../../user/applications/errors/AppError.js";

export interface CreateLocationInput {
  latitude: number;
  longitude: number;
  address?: string | null;
  municipality?: string | null;
  state?: string | null;
  mapProvider?: string | null;
  providerPlaceId?: string | null;
}

export class CreateLocation {
  constructor(private readonly repository: LocationRepository) {}

  async execute(
    userId: string,
    input: CreateLocationInput
  ): Promise<Location> {
    const originId =
      await this.repository.findOriginIdByName("usuario");

    if (!originId) {
      throw new AppError("Origen de ubicación no encontrado", 500);
    }

    const reviewStatusId =
      await this.repository.findReviewStatusIdByName("pendiente");

    if (!reviewStatusId) {
      throw new AppError("Estado de revisión no encontrado", 500);
    }

    return this.repository.create({
      id: randomUUID(),
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
      municipality: input.municipality ?? null,
      state: input.state ?? null,
      originId,
      mapProvider: input.mapProvider ?? null,
      providerPlaceId: input.providerPlaceId ?? null,
      createdByUserId: userId,
      reviewStatusId
    });
  }
}