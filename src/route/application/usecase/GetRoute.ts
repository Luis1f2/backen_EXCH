import type { TravelRoute } from "../../domain/entities/TravelRoute.js";
import type { RouteRepository } from "../../domain/repositories/RouteRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class GetRoute {
  constructor(private readonly repository: RouteRepository) {}

  async execute(id: string): Promise<TravelRoute> {
    const route = await this.repository.findById(id);

    if (!route) {
      throw new AppError("Ruta no encontrada", 404);
    }

    return route;
  }
}