import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";

import type { BusinessScheduleRepository } from "../../domain/repositories/BusinessScheduleRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export class GetBusiness {
  constructor(
    private readonly businessRepository:
      BusinessRepository,

    private readonly scheduleRepository:
      BusinessScheduleRepository
  ) {}

  async execute(id: string) {
    const business =
      await this.businessRepository.findById(id);

    if (
      !business ||
      !business.isVerified
    ) {
      throw new AppError(
        "Negocio no encontrado",
        404
      );
    }

    const schedules =
      await this.scheduleRepository
        .listByBusinessId(id);

    await this.businessRepository
      .incrementViews(id);

    return {
      ...business,
      schedules
    };
  }
}