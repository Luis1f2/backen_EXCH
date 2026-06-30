import { randomUUID } from "node:crypto";

import type { TravelRoute } from "../../domain/entities/TravelRoute.js";
import type { RouteRepository } from "../../domain/repositories/RouteRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export interface CreateRouteInput {
  name: string;
  budget?: number | null;
  durationDays?: number | null;
  destinations: Array<{
    destinationId: string;
    visitOrder: number;
    visitDay: number;
  }>;
}

export class CreateRoute {
  constructor(private readonly repository: RouteRepository) {}

  async execute(
    userId: string,
    input: CreateRouteInput
  ): Promise<TravelRoute> {
    await this.validateDestinations(input.destinations);

    return this.repository.create({
      id: randomUUID(),
      userId,
      name: input.name,
      budget: input.budget ?? null,
      durationDays: input.durationDays ?? null,
      isPersonalized: true,
      destinations: input.destinations
    });
  }

  private async validateDestinations(
    destinations: CreateRouteInput["destinations"]
  ): Promise<void> {
    if (destinations.length === 0) {
      throw new AppError("La ruta debe tener al menos un destino", 400);
    }

    const visitOrders = new Set<number>();

    for (const destination of destinations) {
      if (visitOrders.has(destination.visitOrder)) {
        throw new AppError("El orden de visita no puede repetirse", 400);
      }

      visitOrders.add(destination.visitOrder);

      const exists = await this.repository.destinationExists(
        destination.destinationId
      );

      if (!exists) {
        throw new AppError("Uno o más destinos no existen", 400);
      }
    }
  }
}