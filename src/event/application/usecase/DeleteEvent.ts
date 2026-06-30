import type { EventRepository } from "../../domain/repositories/EventRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class DeleteEvent {
  constructor(private readonly repository: EventRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Evento no encontrado", 404);
    }
  }
}
