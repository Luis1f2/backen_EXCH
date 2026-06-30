import type { TravelRoute } from "../../domain/entities/TravelRoute.js";

import type {
  ListRoutesFilters,
  RouteRepository
} from "../../domain/repositories/RouteRepository.js";

export class ListRoutes {
  constructor(private readonly repository: RouteRepository) {}

  async execute(filters: ListRoutesFilters): Promise<TravelRoute[]> {
    return this.repository.list(filters);
  }
}