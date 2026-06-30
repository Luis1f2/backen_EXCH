import type {
  FavoriteTargetType
} from "../../domain/entities/Favorite.js";

import type {
  FavoriteRepository
} from "../../domain/repositories/FavoriteRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export class RemoveFavorite {
  constructor(private readonly repository: FavoriteRepository) {}

  async execute(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<void> {
    const deleted = await this.repository.delete(
      userId,
      targetType,
      targetId
    );

    if (!deleted) {
      throw new AppError("Favorito no encontrado", 404);
    }
  }
}