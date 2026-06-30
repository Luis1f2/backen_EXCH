import type { Event } from "../../domain/entities/Event.js";
import type { EventRepository } from "../../domain/repositories/EventRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class GetEvent {
  constructor(private readonly repository: EventRepository) {}

  async execute(id: string): Promise<Event> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    return event;
  }
}
