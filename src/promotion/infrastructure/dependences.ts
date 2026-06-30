import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { ListPromotions } from "../application/usecase/ListPromotions.js";
import { CreatePromotion } from "../application/usecase/CreatePromotion.js";
import { UpdatePromotion } from "../application/usecase/UpdatePromotion.js";
import { DeletePromotion } from "../application/usecase/DeletePromotion.js";

import { MySqlPromotionRepository } from "./mysql/MySqlPromotionRepository.js";

import { ListPromotionsController } from "./controller/ListPromotionsController.js";
import { CreatePromotionController } from "./controller/CreatePromotionController.js";
import { UpdatePromotionController } from "./controller/UpdatePromotionController.js";
import { DeletePromotionController } from "./controller/DeletePromotionController.js";

import { createPromotionRoutes } from "./routes/promotionRoutes.js";

export function createPromotionModule(pool: Pool, jwtSecret: string) {
  const repository = new MySqlPromotionRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    list: new ListPromotionsController(new ListPromotions(repository)),
    create: new CreatePromotionController(new CreatePromotion(repository)),
    update: new UpdatePromotionController(new UpdatePromotion(repository)),
    delete: new DeletePromotionController(new DeletePromotion(repository))
  };

  return createPromotionRoutes(controllers, tokenService);
}
