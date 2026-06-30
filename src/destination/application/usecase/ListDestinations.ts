import type { Destination } from "../../domain/entities/Destination.js";

import type {
  DestinationRepository,
  ListDestinationsFilters
} from "../../domain/repositories/DestinationRepository.js";

export class ListDestinations {
  constructor(private readonly repository: DestinationRepository) {}

  async execute(
    filters: ListDestinationsFilters
  ): Promise<Destination[]> {
    return this.repository.list(filters);
  }
}