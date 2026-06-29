import type { Business } from "../../domain/entities/Business.js";
import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";

export class ListMyBusinesses {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(userId: string): Promise<Business[]> {
    return this.repository.listByAdministratorId(userId);
  }
}