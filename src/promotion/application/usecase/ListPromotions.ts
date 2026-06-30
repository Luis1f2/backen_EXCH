import type { Promotion } from "../../domain/entities/Promotion.js";
import type { PromotionRepository } from "../../domain/repositories/PromotionRepository.js";

export class ListPromotions {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(negocioId?: string): Promise<Promotion[]> {
    if (negocioId) return this.repository.listByBusiness(negocioId);
    return this.repository.listActive();
  }
}
