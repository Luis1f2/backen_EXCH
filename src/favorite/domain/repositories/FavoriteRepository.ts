import type {
  Favorite,
  FavoriteTargetType
} from "../entities/Favorite.js";

export interface CreateFavoriteData {
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
}

export interface ListFavoritesFilters {
  userId: string;
  targetType?: FavoriteTargetType;
}

export interface FavoriteRepository {
  create(data: CreateFavoriteData): Promise<Favorite>;

  findByUserAndTarget(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<Favorite | null>;

  listByUser(filters: ListFavoritesFilters): Promise<Favorite[]>;

  delete(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<boolean>;

  targetExists(
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<boolean>;
}