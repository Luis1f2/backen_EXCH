import { randomUUID } from "node:crypto";

import type { Business } from "../../domain/entities/Business.js";
import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export interface CreateBusinessInput {
  name: string;
  description?: string | null;
  businessTypeName: string;
  locationId: string;
  priceFrom?: number | null;
}

export class CreateBusiness {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(
    userId: string,
    input: CreateBusinessInput
  ): Promise<Business> {
    const businessTypeId =
      await this.repository.findBusinessTypeIdByName(
        input.businessTypeName
      );

    if (!businessTypeId) {
      throw new AppError("Tipo de negocio no encontrado", 400);
    }

    const locationExists =
      await this.repository.locationExists(input.locationId);

    if (!locationExists) {
      throw new AppError("Ubicación no encontrada", 400);
    }

    return this.repository.create({
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      businessTypeId,
      locationId: input.locationId,
      priceFrom: input.priceFrom ?? null,
      ownerUserId: userId
    });
  }
}