import type { Favorite } from "../../domain/entities/Favorite.js";

import type {
  FavoriteRepository
} from "../../domain/repositories/FavoriteRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface AddFavoriteInput {
  targetType: "destination" | "business";
  targetId: string;
}

export class AddFavorite {
  constructor(private readonly repository: FavoriteRepository) {}

  async execute(
    userId: string,
    input: AddFavoriteInput
  ): Promise<Favorite> {
    const targetExists = await this.repository.targetExists(
      input.targetType,
      input.targetId
    );

    if (!targetExists) {
      throw new AppError("Entidad favorita no encontrada", 404);
    }

    const existingFavorite =
      await this.repository.findByUserAndTarget(
        userId,
        input.targetType,
        input.targetId
      );

    if (existingFavorite) {
      throw new AppError("Este elemento ya está en favoritos", 409);
    }

    return this.repository.create({
      userId,
      targetType: input.targetType,
      targetId: input.targetId
    });
  }
}