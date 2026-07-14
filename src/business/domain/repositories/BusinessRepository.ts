import type { Business } from "../entities/Business.js";

export interface CreateBusinessData {
  id: string;
  name: string;
  description: string | null;
  businessTypeId: string;
  locationId: string;
  priceFrom: number | null;
  ownerUserId: string;
}

export interface UpdateBusinessData {
  name?: string;
  description?: string | null;
  businessTypeId?: string;
  locationId?: string;
  priceFrom?: number | null;
}

export interface ListBusinessesFilters {
  businessTypeId?: string;
  locationId?: string;
  municipality?: string;
  state?: string;
  isVerified?: boolean;
  limit: number;
  offset: number;
}

export interface BusinessRepository {
  create(data: CreateBusinessData): Promise<Business>;

  findById(id: string): Promise<Business | null>;

  list(filters: ListBusinessesFilters): Promise<Business[]>;

  listByAdministratorId(userId: string): Promise<Business[]>;

  update(
    id: string,
    data: UpdateBusinessData
  ): Promise<Business | null>;

  delete(id: string): Promise<boolean>;

  findBusinessTypeIdByName(name: string): Promise<string | null>;

  locationExists(id: string): Promise<boolean>;

  /**
   * Comprueba que el usuario sea el propietario activo del negocio.
   * Se utiliza para editar o eliminar el registro del negocio.
   */
  isUserBusinessOwner(
    userId: string,
    businessId: string
  ): Promise<boolean>;

  /**
   * Comprueba que el usuario tenga acceso administrativo aprobado.
   * Se utilizará para horarios, servicios, promociones y estadísticas.
   */
    isUserBusinessAdministrator(
    userId: string,
    businessId: string
  ): Promise<boolean>;

  incrementViews(
    businessId: string
  ): Promise<void>;

}