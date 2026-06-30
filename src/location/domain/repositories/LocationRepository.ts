import type { Location } from "../entities/Location.js";

export interface CreateLocationData {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  municipality: string | null;
  state: string | null;
  originId: string | null;
  mapProvider: string | null;
  providerPlaceId: string | null;
  createdByUserId: string | null;
  reviewStatusId: string | null;
}

export interface UpdateLocationData {
  latitude?: number;
  longitude?: number;
  address?: string | null;
  municipality?: string | null;
  state?: string | null;
  mapProvider?: string | null;
  providerPlaceId?: string | null;
  reviewStatusId?: string | null;
}

export interface ListLocationsFilters {
  municipality?: string;
  state?: string;
  limit: number;
  offset: number;
}

export interface LocationRepository {
  create(data: CreateLocationData): Promise<Location>;
  findById(id: string): Promise<Location | null>;
  list(filters: ListLocationsFilters): Promise<Location[]>;

  update(
    id: string,
    data: UpdateLocationData
  ): Promise<Location | null>;

  findOriginIdByName(name: string): Promise<string | null>;
  findReviewStatusIdByName(name: string): Promise<string | null>;
}