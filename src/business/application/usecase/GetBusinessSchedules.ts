import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";
import type { BusinessScheduleRepository } from "../../domain/repositories/BusinessScheduleRepository.js";
import type { BusinessSchedule } from "../../domain/entities/BusinessSchedule.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class GetBusinessSchedules {
  constructor(
    private readonly scheduleRepository: BusinessScheduleRepository,
    private readonly businessRepository: BusinessRepository
  ) {}

  async execute(
    userId: string,
    businessId: string
  ): Promise<BusinessSchedule[]> {
    const business =
      await this.businessRepository.findById(businessId);

    if (!business) {
      throw new AppError("Negocio no encontrado", 404);
    }

    const hasPermission =
      await this.businessRepository.isUserBusinessAdministrator(
        userId,
        businessId
      );

    if (!hasPermission) {
      throw new AppError(
        "El negocio debe estar aprobado y debes ser su administrador",
        403
      );
    }

    return this.scheduleRepository.listByBusinessId(
      businessId
    );
  }
}