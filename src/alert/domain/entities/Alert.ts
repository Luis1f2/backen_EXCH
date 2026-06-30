export type AlertEntityType =
  | "destino"
  | "negocio"
  | "ubicacion"
  | "resena_destino"
  | "resena_negocio"
  | "resena_ubicacion";

export interface Alert {
  id: string;
  typeId: string;
  typeName: string;
  description: string;
  statusId: string;
  statusName: string;
  scopeId: string;
  scopeName: string;
  entityTypeId: string | null;
  entityTypeName: AlertEntityType | null;
  entityId: string | null;
  generatedAt: Date;
  attendedByUserId: string | null;
}