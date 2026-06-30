import type { TravelRoute } from "../../domain/entities/TravelRoute.js";
import type { RouteRepository } from "../../domain/repositories/RouteRepository.js";

export class ListMyRoutes {
  constructor(private readonly repository: RouteRepository) {}

  async execute(userId: string): Promise<TravelRoute[]> {
    return this.repository.list({
      userId,
      limit: 100,
      offset: 0
    });
  }
}