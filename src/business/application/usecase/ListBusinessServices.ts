import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";

import type { BusinessServiceRepository } from "../../domain/repositories/BusinessServicesRepositories.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export class ListBusinessServices {
  constructor(
    private readonly serviceRepository:
      BusinessServiceRepository,

    private readonly businessRepository:
      BusinessRepository
  ) {}

  async execute(businessId: string) {
    const business =
      await this.businessRepository.findById(
        businessId
      );

    if (!business || !business.isVerified) {
      throw new AppError(
        "Negocio no encontrado",
        404
      );
    }

    return this.serviceRepository.listByBusinessId(
      businessId
    );
  }
}