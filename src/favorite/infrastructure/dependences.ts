import type { Pool } from "pg";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { AddFavorite } from "../application/usecase/AddFavorite.js";
import { ListMyFavorites } from "../application/usecase/ListMyFavorites.js";
import { RemoveFavorite } from "../application/usecase/RemoveFavorite.js";

import { MySqlFavoriteRepository } from "./mysql/MySqlFavoriteRepository.js";

import { AddFavoriteController } from "./controller/AddFavoriteController.js";
import { ListMyFavoritesController } from "./controller/ListMyFavoritesController.js";
import { RemoveFavoriteController } from "./controller/RemoveFavoriteController.js";

import { createFavoriteRoutes } from "./routes/favoriteRoutes.js";

export function createFavoriteModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlFavoriteRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    add: new AddFavoriteController(
      new AddFavorite(repository)
    ),
    listMine: new ListMyFavoritesController(
      new ListMyFavorites(repository)
    ),
    remove: new RemoveFavoriteController(
      new RemoveFavorite(repository)
    )
  };

  return createFavoriteRoutes(controllers, tokenService);
}