import type { Location } from "../../domain/entities/Location.js";

import type {
  ListLocationsFilters,
  LocationRepository
} from "../../domain/repositories/LocationRepository.js";

export class ListLocations {
  constructor(private readonly repository: LocationRepository) {}

  async execute(filters: ListLocationsFilters): Promise<Location[]> {
    return this.repository.list(filters);
  }
}