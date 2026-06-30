import type { TravelRoute } from "../../domain/entities/TravelRoute.js";

import type {
  RouteRepository,
  UpdateRouteData
} from "../../domain/repositories/RouteRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface UpdateRouteInput {
  name?: string;
  budget?: number | null;
  durationDays?: number | null;
  destinations?: Array<{
    destinationId: string;
    visitOrder: number;
    visitDay: number;
  }>;
}

export class UpdateRoute {
  constructor(private readonly repository: RouteRepository) {}

  async execute(
    userId: string,
    routeId: string,
    input: UpdateRouteInput
  ): Promise<TravelRoute> {
    const route = await this.repository.findById(routeId);

    if (!route) {
      throw new AppError("Ruta no encontrada", 404);
    }

    if (route.userId !== userId) {
      throw new AppError("No tienes permisos para modificar esta ruta", 403);
    }

    if (input.destinations !== undefined) {
      await this.validateDestinations(input.destinations);
    }

    const updateData: UpdateRouteData = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.budget !== undefined) {
      updateData.budget = input.budget;
    }

    if (input.durationDays !== undefined) {
      updateData.durationDays = input.durationDays;
    }

    if (input.destinations !== undefined) {
      updateData.destinations = input.destinations;
    }

    const updatedRoute = await this.repository.update(routeId, updateData);

    if (!updatedRoute) {
      throw new AppError("No se pudo actualizar la ruta", 500);
    }

    return updatedRoute;
  }

  private async validateDestinations(
    destinations: NonNullable<UpdateRouteInput["destinations"]>
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