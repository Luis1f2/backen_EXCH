import type {
  Alert,
  AlertEntityType
} from "../entities/Alert.js";

export interface CreateAlertData {
  id: string;
  typeId: string;
  description: string;
  statusId: string;
  scopeId: string;
  entityTypeId: string | null;
  entityId: string | null;
}

export interface ListAlertsFilters {
  typeName?: string;
  statusName?: string;
  scopeName?: string;
  entityTypeName?: AlertEntityType;
  entityId?: string;
  limit: number;
  offset: number;
}

export interface AlertRepository {
  create(data: CreateAlertData): Promise<Alert>;
  findById(id: string): Promise<Alert | null>;
  list(filters: ListAlertsFilters): Promise<Alert[]>;

  markAsAttended(
    id: string,
    userId: string
  ): Promise<Alert | null>;

  discard(
    id: string,
    userId: string
  ): Promise<Alert | null>;

  findTypeIdByName(name: string): Promise<string | null>;
  findStatusIdByName(name: string): Promise<string | null>;
  findScopeIdByName(name: string): Promise<string | null>;
  findEntityTypeIdByName(name: AlertEntityType): Promise<string | null>;

  entityExists(
    entityType: AlertEntityType,
    entityId: string
  ): Promise<boolean>;
}