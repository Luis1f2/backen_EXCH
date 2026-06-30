import { randomUUID } from "node:crypto";

import type {
  Alert,
  AlertEntityType
} from "../../domain/entities/Alert.js";

import type { AlertRepository } from "../../domain/repositories/AlertRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export interface CreateAlertInput {
  typeName: string;
  description: string;
  scopeName: string;
  entityType?: AlertEntityType | null;
  entityId?: string | null;
}

export class CreateAlert {
  constructor(private readonly repository: AlertRepository) {}

  async execute(input: CreateAlertInput): Promise<Alert> {
    const typeId = await this.repository.findTypeIdByName(
      input.typeName
    );

    if (!typeId) {
      throw new AppError("Tipo de alerta no encontrado", 400);
    }

    const pendingStatusId =
      await this.repository.findStatusIdByName("pendiente");

    if (!pendingStatusId) {
      throw new AppError("Estado de alerta pendiente no encontrado", 500);
    }

    const scopeId = await this.repository.findScopeIdByName(
      input.scopeName
    );

    if (!scopeId) {
      throw new AppError("Ámbito de alerta no encontrado", 400);
    }

    const hasEntityType = input.entityType !== undefined && input.entityType !== null;
    const hasEntityId = input.entityId !== undefined && input.entityId !== null;

    if (hasEntityType !== hasEntityId) {
      throw new AppError(
        "entityType y entityId deben enviarse juntos",
        400
      );
    }

    let entityTypeId: string | null = null;
    let entityId: string | null = null;

    if (hasEntityType && hasEntityId) {
      const foundEntityTypeId =
        await this.repository.findEntityTypeIdByName(input.entityType!);

      if (!foundEntityTypeId) {
        throw new AppError("Tipo de entidad no encontrado", 400);
      }

      const entityExists = await this.repository.entityExists(
        input.entityType!,
        input.entityId!
      );

      if (!entityExists) {
        throw new AppError("Entidad relacionada no encontrada", 400);
      }

      entityTypeId = foundEntityTypeId;
      entityId = input.entityId!;
    }

    return this.repository.create({
      id: randomUUID(),
      typeId,
      description: input.description,
      statusId: pendingStatusId,
      scopeId,
      entityTypeId,
      entityId
    });
  }
}