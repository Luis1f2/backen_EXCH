import { randomUUID } from "node:crypto";

import { AppError } from "../../../user/application/errors/AppError.js";

import type {
  Event,
} from "../../domain/entities/Event.js";

import type {
  EventRepository,
} from "../../domain/repositories/EventRepository.js";

export interface CreateEventInput {
  titulo: string;
  descripcion?: string | null;
  fechaInicio: Date;
  fechaFin?: Date | null;
  ubicacionId?: string | null;
  categoriaId?: string | null;
}

export class CreateEvent {
  constructor(
    private readonly repository:
      EventRepository,
  ) {}

  async execute(
    userId: string,
    input: CreateEventInput,
  ): Promise<Event> {
    /*
     * Validación cruzada de fechas.
     *
     * Un evento no puede finalizar
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

    if (input.categoriaId) {
      const validCategory =
        await this.repository
          .categoryCanBeUsedForEvents(
            input.categoriaId,
          );

      if (!validCategory) {
        throw new AppError(
          "La categoría seleccionada no está habilitada para eventos",
          400,
        );
      }
    }

    return this.repository.create({
      id: randomUUID(),
      titulo: input.titulo,
      descripcion:
        input.descripcion ?? null,
      fechaInicio:
        input.fechaInicio,
      fechaFin:
        input.fechaFin ?? null,
      ubicacionId:
        input.ubicacionId ?? null,
      categoriaId:
        input.categoriaId ?? null,
      creadoPor: userId,
    });
  }
}