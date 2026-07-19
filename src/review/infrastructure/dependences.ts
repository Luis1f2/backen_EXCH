import type { Pool } from "pg";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { CreateReview } from "../application/usecase/CreateReview.js";
import { GetReview } from "../application/usecase/GetReview.js";
import { ListReviews } from "../application/usecase/ListReviews.js";
import { UpdateReview } from "../application/usecase/UpdateReview.js";
import { DeleteReview } from "../application/usecase/DeleteReview.js";

import { MySqlReviewRepository } from "./mysql/MySqlReviewRepository.js";

import { CreateReviewController } from "./controller/CreateReviewController.js";
import { GetReviewController } from "./controller/GetReviewController.js";
import { ListReviewsController } from "./controller/ListReviewsController.js";
import { UpdateReviewController } from "./controller/UpdateReviewController.js";
import { DeleteReviewController } from "./controller/DeleteReviewController.js";

import { createReviewRoutes } from "./routes/reviewRoutes.js";

export function createReviewModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlReviewRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    create: new CreateReviewController(
      new CreateReview(repository)
    ),
    get: new GetReviewController(
      new GetReview(repository)
    ),
    list: new ListReviewsController(
      new ListReviews(repository)
    ),
    update: new UpdateReviewController(
      new UpdateReview(repository)
    ),
    delete: new DeleteReviewController(
      new DeleteReview(repository)
    )
  };

  return createReviewRoutes(controllers, tokenService);
}