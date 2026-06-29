import type { Business } from "../../domain/entities/Business.js";
import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";
import { AppError } from "../../../user/applications/errors/AppError.js";

export class GetBusiness {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(id: string): Promise<Business> {
    const business = await this.repository.findById(id);

    if (!business) {
      throw new AppError("Negocio no encontrado", 404);
    }

    return business;
  }
}