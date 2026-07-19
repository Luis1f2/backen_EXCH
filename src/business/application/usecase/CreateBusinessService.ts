import { randomUUID } from "node:crypto";

import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";

import type { BusinessServiceRepository } from "../../domain/repositories/BusinessServicesRepositories.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface CreateBusinessServiceInput {
  name: string;
  description?: string | null;
  additionalPrice?: number | null;
}

export class CreateBusinessService {
  constructor(
    private readonly serviceRepository:
      BusinessServiceRepository,

    private readonly businessRepository:
      BusinessRepository
  ) {}

  async execute(
    userId: string,
    businessId: string,
    input: CreateBusinessServiceInput
  ) {
    const hasPermission =
    await this.businessRepository
      .isUserBusinessOwner(
      userId,
      businessId
    );

   if (!hasPermission) {
    throw new AppError(
    "No tienes permisos para agregar servicios a este negocio",
    403
  );
}

    return this.serviceRepository.create({
      id: randomUUID(),
      businessId,
      name: input.name,
      description:
        input.description ?? null,
      additionalPrice:
        input.additionalPrice ?? null
    });
  }
}