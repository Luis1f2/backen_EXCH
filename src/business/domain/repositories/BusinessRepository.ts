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

  isUserBusinessAdministrator(
    userId: string,
    businessId: string
  ): Promise<boolean>;
}