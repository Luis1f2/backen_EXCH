import type { Event } from "../../domain/entities/Event.js";
import type { EventRepository, UpdateEventData } from "../../domain/repositories/EventRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class UpdateEvent {
  constructor(private readonly repository: EventRepository) {}

  async execute(id: string, data: UpdateEventData): Promise<Event> {
    const updated = await this.repository.update(id, data);

    if (!updated) {
      throw new AppError("Evento no encontrado", 404);
    }

    return updated;
  }
}
