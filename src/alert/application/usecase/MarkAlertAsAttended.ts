import type { Alert } from "../../domain/entities/Alert.js";
import type { AlertRepository } from "../../domain/repositories/AlertRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class MarkAlertAsAttended {
  constructor(private readonly repository: AlertRepository) {}

  async execute(
    alertId: string,
    userId: string
  ): Promise<Alert> {
    const alert = await this.repository.findById(alertId);

    if (!alert) {
      throw new AppError("Alerta no encontrada", 404);
    }

    if (alert.statusName === "atendida") {
      throw new AppError("La alerta ya fue atendida", 409);
    }

    const updatedAlert = await this.repository.markAsAttended(
      alertId,
      userId
    );

    if (!updatedAlert) {
      throw new AppError("No se pudo atender la alerta", 500);
    }

    return updatedAlert;
  }
}