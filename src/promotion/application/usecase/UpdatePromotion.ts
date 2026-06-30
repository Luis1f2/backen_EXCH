import type { Promotion } from "../../domain/entities/Promotion.js";
import type { PromotionRepository, UpdatePromotionData } from "../../domain/repositories/PromotionRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class UpdatePromotion {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(promotionId: string, userId: string, data: UpdatePromotionData): Promise<Promotion> {
    const hasAccess = await this.repository.isOwner(promotionId, userId);

    if (!hasAccess) {
      throw new AppError("No tienes permisos sobre esta promocion", 403);
    }

    const updated = await this.repository.update(promotionId, data);

    if (!updated) {
      throw new AppError("Promocion no encontrada", 404);
    }

    return updated;
  }
}
