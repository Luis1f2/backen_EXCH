import { randomUUID } from "node:crypto";

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
    return this.repository.create({
      id: randomUUID(),
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin ?? null,
      ubicacionId: input.ubicacionId ?? null,
      categoriaId: input.categoriaId ?? null,
      creadoPor: userId
    });
  }
}
