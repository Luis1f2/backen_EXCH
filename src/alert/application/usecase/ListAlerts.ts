import type { Alert } from "../../domain/entities/Alert.js";

import type {
  AlertRepository,
  ListAlertsFilters
} from "../../domain/repositories/AlertRepository.js";

export class ListAlerts {
  constructor(private readonly repository: AlertRepository) {}

  async execute(filters: ListAlertsFilters): Promise<Alert[]> {
    return this.repository.list(filters);
  }
}