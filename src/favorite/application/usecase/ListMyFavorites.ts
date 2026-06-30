import type {
  Favorite,
  FavoriteTargetType
} from "../../domain/entities/Favorite.js";

import type {
  FavoriteRepository
} from "../../domain/repositories/FavoriteRepository.js";

export interface ListMyFavoritesInput {
  targetType?: FavoriteTargetType;
}

export class ListMyFavorites {
  constructor(private readonly repository: FavoriteRepository) {}

  async execute(
    userId: string,
    input: ListMyFavoritesInput
  ): Promise<Favorite[]> {
    return this.repository.listByUser({
      userId,
      targetType: input.targetType
    });
  }
}