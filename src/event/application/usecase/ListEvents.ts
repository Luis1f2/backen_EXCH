import type { Event } from "../../domain/entities/Event.js";
import type { EventRepository } from "../../domain/repositories/EventRepository.js";

export class ListEvents {
  constructor(private readonly repository: EventRepository) {}

  async execute(proximasOnly = false): Promise<Event[]> {
    return this.repository.list(proximasOnly);
  }
}
