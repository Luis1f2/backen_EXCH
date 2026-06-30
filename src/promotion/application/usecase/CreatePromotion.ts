import { randomUUID } from "node:crypto";

import type { Promotion } from "../../domain/entities/Promotion.js";
import type { PromotionRepository } from "../../domain/repositories/PromotionRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export interface CreatePromotionInput {
  titulo: string;
  descripcion?: string | null;
  precio?: number | null;
  negocioId: string;
  fechaInicio: Date;
  fechaFin?: Date | null;
}

export class CreatePromotion {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(userId: string, input: CreatePromotionInput): Promise<Promotion> {
    const hasAccess = await this.repository.isBusinessOwner(input.negocioId, userId);

    if (!hasAccess) {
      throw new AppError("No tienes permisos sobre este negocio", 403);
    }

    return this.repository.create({
      id: randomUUID(),
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
      precio: input.precio ?? null,
      negocioId: input.negocioId,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin ?? null,
      creadoPor: userId
    });
  }
}
