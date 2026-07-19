import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";

import type { BusinessServiceRepository } from "../../domain/repositories/BusinessServicesRepositories.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export class DeleteBusinessService {
  constructor(
    private readonly serviceRepository:
      BusinessServiceRepository,

    private readonly businessRepository:
      BusinessRepository
  ) {}

  async execute(
    userId: string,
    businessId: string,
    serviceId: string
  ): Promise<void> {
    const hasPermission =
      await this.businessRepository
        .isUserBusinessAdministrator(
          userId,
          businessId
        );

    if (!hasPermission) {
      throw new AppError(
        "El negocio debe estar aprobado y debes ser su administrador",
        403
      );
    }

    const service =
      await this.serviceRepository.findById(
        serviceId
      );

    if (
      !service ||
      service.businessId !== businessId
    ) {
      throw new AppError(
        "Servicio no encontrado",
        404
      );
    }

    const deleted =
      await this.serviceRepository.delete(
        serviceId
      );

    if (!deleted) {
      throw new AppError(
        "Servicio no encontrado",
        404
      );
    }
  }
}