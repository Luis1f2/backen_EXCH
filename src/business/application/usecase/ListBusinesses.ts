import type { Business } from "../../domain/entities/Business.js";

import type {
  BusinessRepository,
  ListBusinessesFilters
} from "../../domain/repositories/BusinessRepository.js";

export class ListBusinesses {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(
    filters: ListBusinessesFilters
  ): Promise<Business[]> {
    return this.repository.list(filters);
  }
}