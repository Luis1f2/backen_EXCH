import type {
  Promotion,
} from "../../domain/entities/Promotion.js";

import type {
  PromotionRepository,
  UpdatePromotionData,
} from "../../domain/repositories/PromotionRepository.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

export class UpdatePromotion {
  constructor(
    private readonly repository:
      PromotionRepository,
  ) {}

  async execute(
    promotionId: string,
    userId: string,
    data: UpdatePromotionData,
  ): Promise<Promotion> {
    /*
     * Primero comprobamos que el usuario
     * tenga permisos sobre la promoción.
     */
    const hasAccess =
      await this.repository.isOwner(
        promotionId,
        userId,
      );

    if (!hasAccess) {
      throw new AppError(
        "No tienes permisos sobre esta promocion",
        403,
      );
    }

    /*
     * Necesitamos los valores actuales
     * porque PATCH puede modificar solamente
     * una de las dos fechas.
     */
    const current =
      await this.repository.findById(
        promotionId,
      );

      if (!current) {
      throw new AppError(
        "Promocion no encontrada",
        404,
      );
    }

    const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0,
      );

      if (data.fechaInicio !== undefined) {
      const fechaInicioDay =
      new Date(data.fechaInicio);

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
}

if (
  data.fechaFin !== undefined &&
  data.fechaFin !== null
) {
  const fechaFinDay =
    new Date(data.fechaFin);

  fechaFinDay.setHours(
    0,
    0,
    0,
    0,
  );

  if (fechaFinDay < today) {
    throw new AppError(
      "La fecha de fin no puede estar en el pasado",
      400,
    );
  }
}


    const effectiveFechaInicio =
      data.fechaInicio ??
      current.fechaInicio;

    const effectiveFechaFin =
      data.fechaFin === undefined
        ? current.fechaFin
        : data.fechaFin;

    if (
      effectiveFechaFin !== null &&
      effectiveFechaFin <
        effectiveFechaInicio
    ) {
      throw new AppError(
        "La fecha de fin no puede ser anterior a la fecha de inicio",
        400,
      );
    }

    const updated =
      await this.repository.update(
        promotionId,
        data,
      );

    if (!updated) {
      throw new AppError(
        "Promocion no encontrada",
        404,
      );
    }

    return updated;
  }
}