import type { Alert } from "../../domain/entities/Alert.js";
import type { AlertRepository } from "../../domain/repositories/AlertRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class GetAlert {
  constructor(private readonly repository: AlertRepository) {}

  async execute(id: string): Promise<Alert> {
    const alert = await this.repository.findById(id);

    if (!alert) {
      throw new AppError("Alerta no encontrada", 404);
    }

    return alert;
  }
}