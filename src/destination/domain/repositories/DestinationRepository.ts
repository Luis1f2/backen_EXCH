import type { Destination } from "../entities/Destination.js";

export interface CreateDestinationData {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  locationId: string;
}

export interface UpdateDestinationData {
  name?: string;
  description?: string | null;
  categoryId?: string;
  locationId?: string;
  imageUrl?: string | null;
}

export interface ListDestinationsFilters {
  categoryId?: string;
  locationId?: string;
  municipality?: string;
  state?: string;
  limit: number;
  offset: number;
}

export interface DestinationRepository {
  create(data: CreateDestinationData): Promise<Destination>;
  findById(id: string): Promise<Destination | null>;
  list(filters: ListDestinationsFilters): Promise<Destination[]>;

  update(
    id: string,
    data: UpdateDestinationData
  ): Promise<Destination | null>;

  delete(id: string): Promise<boolean>;

  findCategoryIdByName(name: string): Promise<string | null>;
  locationExists(id: string): Promise<boolean>;
}