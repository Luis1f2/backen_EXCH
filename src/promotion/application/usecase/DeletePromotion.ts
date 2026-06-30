import type { PromotionRepository } from "../../domain/repositories/PromotionRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class DeletePromotion {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(promotionId: string, userId: string): Promise<void> {
    const hasAccess = await this.repository.isOwner(promotionId, userId);

    if (!hasAccess) {
      throw new AppError("No tienes permisos sobre esta promocion", 403);
    }

    const deleted = await this.repository.delete(promotionId);

    if (!deleted) {
      throw new AppError("Promocion no encontrada", 404);
    }
  }
}
