import { AppError } from "../../../user/application/errors/AppError.js";
import type { Event } from "../../domain/entities/Event.js";
import type {
  EventRepository,
  UpdateEventData,
} from "../../domain/repositories/EventRepository.js";

export class UpdateEvent {
  constructor(private readonly repository: EventRepository) {}

  async execute(id: string, data: UpdateEventData): Promise<Event> {
    if (data.categoriaId !== undefined && data.categoriaId !== null) {
      const validCategory = await this.repository.categoryCanBeUsedForEvents(
        data.categoriaId,
      );

      if (!validCategory) {
        throw new AppError(
          "La categoría seleccionada no está habilitada para eventos",
          400,
        );
      }
    }

    const updated = await this.repository.update(id, data);

    if (!updated) {
      throw new AppError("Evento no encontrado", 404);
    }

    return updated;
  }
}
