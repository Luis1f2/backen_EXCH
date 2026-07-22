import {
  randomUUID,
} from "node:crypto";

import type {
  Promotion,
} from "../../domain/entities/Promotion.js";

import type {
  PromotionRepository,
} from "../../domain/repositories/PromotionRepository.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

export interface CreatePromotionInput {
  titulo: string;
  descripcion?: string | null;
  precio?: number | null;
  negocioId: string;
  fechaInicio: Date;
  fechaFin?: Date | null;
}

export class CreatePromotion {
  constructor(
    private readonly repository:
      PromotionRepository,
  ) {}

  async execute(
    userId: string,
    input: CreatePromotionInput,
  ): Promise<Promotion> {
    /*
     * Una promoción no puede finalizar
     * antes de comenzar.
     */
    
    const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  const fechaInicioDay =
    new Date(input.fechaInicio);

    fechaInicioDay.setHours(
    0,
    0,
    0,
    0,
  );

if (fechaInicioDay < today) {
  throw new AppError(
    "La fecha de inicio no puede estar en el pasado",
    400,
  );
}
    
    if (
      input.fechaFin !== undefined &&
      input.fechaFin !== null &&
      input.fechaFin <
        input.fechaInicio
    ) {
      throw new AppError(
        "La fecha de fin no puede ser anterior a la fecha de inicio",
        400,
      );
    }

    const hasAccess =
      await this.repository
        .isBusinessOwner(
          input.negocioId,
          userId,
        );

    if (!hasAccess) {
      throw new AppError(
        "No tienes permisos sobre este negocio",
        403,
      );
    }

    return this.repository.create({
      id: randomUUID(),
      titulo:
        input.titulo,
      descripcion:
        input.descripcion ?? null,
      precio:
        input.precio ?? null,
      negocioId:
        input.negocioId,
      fechaInicio:
        input.fechaInicio,
      fechaFin:
        input.fechaFin ?? null,
      creadoPor:
        userId,
    });
  }
}