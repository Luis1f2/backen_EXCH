import type { Event } from "../../domain/entities/Event.js";
import type {
  EventRepository,
  ListEventsFilter,
} from "../../domain/repositories/EventRepository.js";

export class ListEvents {
  constructor(private readonly repository: EventRepository) {}

  async execute(filters: ListEventsFilter = {}): Promise<Event[]> {
    return this.repository.list(filters);
  }
}
