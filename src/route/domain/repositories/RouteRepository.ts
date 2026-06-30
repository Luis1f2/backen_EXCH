import type {
  RouteDestination,
  TravelRoute
} from "../entities/TravelRoute.js";

export interface CreateRouteData {
  id: string;
  userId: string | null;
  name: string;
  budget: number | null;
  durationDays: number | null;
  isPersonalized: boolean;
  destinations: RouteDestination[];
}

export interface UpdateRouteData {
  name?: string;
  budget?: number | null;
  durationDays?: number | null;
  destinations?: RouteDestination[];
}

export interface ListRoutesFilters {
  userId?: string | null;
  onlyPublic?: boolean;
  limit: number;
  offset: number;
}

export interface RouteRepository {
  create(data: CreateRouteData): Promise<TravelRoute>;
  findById(id: string): Promise<TravelRoute | null>;
  list(filters: ListRoutesFilters): Promise<TravelRoute[]>;

  update(
    id: string,
    data: UpdateRouteData
  ): Promise<TravelRoute | null>;

  delete(id: string): Promise<boolean>;

  destinationExists(destinationId: string): Promise<boolean>;
}