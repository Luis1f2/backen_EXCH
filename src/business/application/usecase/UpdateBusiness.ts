import type { Business } from "../../domain/entities/Business.js";

import type {
  BusinessRepository,
  UpdateBusinessData
} from "../../domain/repositories/BusinessRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface UpdateBusinessInput {
  name?: string;
  description?: string | null;
  businessTypeName?: string;
  locationId?: string;
  priceFrom?: number | null;
}

export class UpdateBusiness {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(
    userId: string,
    businessId: string,
    input: UpdateBusinessInput
  ): Promise<Business> {
    const business = await this.repository.findById(businessId);

    if (!business) {
      throw new AppError("Negocio no encontrado", 404);
    }

    const hasPermission =
      await this.repository.isUserBusinessAdministrator(
        userId,
        businessId
      );

    if (!hasPermission) {
      throw new AppError("No tienes permisos para modificar este negocio", 403);
    }

    const updateData: UpdateBusinessData = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.priceFrom !== undefined) {
      updateData.priceFrom = input.priceFrom;
    }

    if (input.businessTypeName !== undefined) {
      const businessTypeId =
        await this.repository.findBusinessTypeIdByName(
          input.businessTypeName
        );

      if (!businessTypeId) {
        throw new AppError("Tipo de negocio no encontrado", 400);
      }

      updateData.businessTypeId = businessTypeId;
    }

    if (input.locationId !== undefined) {
      const locationExists =
        await this.repository.locationExists(input.locationId);

      if (!locationExists) {
        throw new AppError("Ubicación no encontrada", 400);
      }

      updateData.locationId = input.locationId;
    }

    const updatedBusiness = await this.repository.update(
      businessId,
      updateData
    );

    if (!updatedBusiness) {
      throw new AppError("No se pudo actualizar el negocio", 500);
    }

    return updatedBusiness;
  }
}