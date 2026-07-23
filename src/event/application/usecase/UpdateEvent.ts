import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import type {
  Event,
} from "../../domain/entities/Event.js";

import type {
  EventRepository,
  UpdateEventData,
} from "../../domain/repositories/EventRepository.js";

export class UpdateEvent {
  constructor(
    private readonly repository:
      EventRepository,
  ) {}

  async execute(
    id: string,
    data: UpdateEventData,
  ): Promise<Event> {
    /*
     * Recuperamos primero el estado actual
     * porque PATCH puede recibir solamente
     * fechaInicio o solamente fechaFin.
     */
    const current =
      await this.repository.findById(id);

    if (!current) {
      throw new AppError(
        "Evento no encontrado",
        404,
      );
    }

    /*
     * Calculamos cómo quedarían realmente
     * las fechas después del PATCH.
     */

    const today = new Date();

today.setHours(
  0,
  0,
  0,
  0,
);

/*
 * Solo validamos contra "hoy" las fechas
 * que realmente vienen en el PATCH.
 *
 * Un evento antiguo puede seguir siendo
 * editado mientras sus fechas históricas
 * no sean reemplazadas por otras fechas
 * también pasadas.
 */
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
        "La fecha y hora de fin deben ser posteriores a la fecha y hora de inicio",
        400,
      );
    }

    if (
      data.categoriaId !== undefined &&
      data.categoriaId !== null
    ) {
      const validCategory =
        await this.repository
          .categoryCanBeUsedForEvents(
            data.categoriaId,
          );

      if (!validCategory) {
        throw new AppError(
          "La categoría seleccionada no está habilitada para eventos",
          400,
        );
      }
    }

    const updated =
      await this.repository.update(
        id,
        data,
      );

    if (!updated) {
      throw new AppError(
        "Evento no encontrado",
        404,
      );
    }

    return updated;
  }
}