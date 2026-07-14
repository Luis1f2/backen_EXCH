import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";

import type {
  BusinessServiceRepository,
  UpdateBusinessServiceData
} from "../../domain/repositories/BusinessServiceRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export class UpdateBusinessService {
  constructor(
    private readonly serviceRepository:
      BusinessServiceRepository,

    private readonly businessRepository:
      BusinessRepository
  ) {}

  async execute(
    userId: string,
    businessId: string,
    serviceId: string,
    input: UpdateBusinessServiceData
  ) {
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

    const updated =
      await this.serviceRepository.update(
        serviceId,
        input
      );

    if (!updated) {
      throw new AppError(
        "Servicio no encontrado",
        404
      );
    }

    return updated;
  }
}