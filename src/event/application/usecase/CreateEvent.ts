import { randomUUID } from "node:crypto";
import { AppError } from "../../../user/application/errors/AppError.js";
import type { Event } from "../../domain/entities/Event.js";
import type { EventRepository } from "../../domain/repositories/EventRepository.js";

export interface CreateEventInput {
  titulo: string;
  descripcion?: string | null;
  fechaInicio: Date;
  fechaFin?: Date | null;
  ubicacionId?: string | null;
  categoriaId?: string | null;
}

export class CreateEvent {
  constructor(private readonly repository: EventRepository) {}

  async execute(userId: string, input: CreateEventInput): Promise<Event> {
    if (input.categoriaId) {
      const validCategory = await this.repository.categoryCanBeUsedForEvents(
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
      descripcion: input.descripcion ?? null,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin ?? null,
      ubicacionId: input.ubicacionId ?? null,
      categoriaId: input.categoriaId ?? null,
      creadoPor: userId,
    });
  }
}
