import type { BusinessRepository } from "../../domain/repositories/BusinessRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class DeleteBusiness {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(
    userId: string,
    businessId: string
  ): Promise<void> {
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
      throw new AppError("No tienes permisos para eliminar este negocio", 403);
    }

    const deleted = await this.repository.delete(businessId);

    if (!deleted) {
      throw new AppError("No se pudo eliminar el negocio", 500);
    }
  }
}