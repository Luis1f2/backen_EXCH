import type { Pool } from
  "mysql2/promise";

import {
  JwtTokenService
} from "../../user/infrastructure/security/SecurityAdapters.js";

import {
  UploadBusinessImage
} from "../application/usecase/UploadBusinessImage.js";

import {
  UploadResenaImage
} from "../application/usecase/UploadResenaImage.js";

import {
  UploadPromotionImage
} from "../application/usecase/UploadPromotionImage.js";

import {
  UploadEventImage
} from "../application/usecase/UploadEventImage.js";

import {
  UploadUserProfileImage
} from "../application/usecase/UploadUserProfileImage.js";

import {
  UploadBusinessImageController
} from "./controller/UploadBusinessImageController.js";

import {
  UploadResenaImageController
} from "./controller/UploadResenaImageController.js";

import {
  UploadPromotionImageController
} from "./controller/UploadPromotionImageController.js";

import {
  UploadEventImageController
} from "./controller/UploadEventImageController.js";

import {
  UploadUserProfileImageController
} from "./controller/UploadUserProfileImageController.js";

import {
  createUploadRoutes
} from "./routes/uploadRoutes.js";

export function createUploadModule(
  pool: Pool,
  jwtSecret: string
) {
  const tokenService =
    new JwtTokenService(jwtSecret);

  const controllers = {
    business:
      new UploadBusinessImageController(
        new UploadBusinessImage(pool)
      ),

    resena:
      new UploadResenaImageController(
        new UploadResenaImage(pool)
      ),

    promotion:
      new UploadPromotionImageController(
        new UploadPromotionImage(pool)
      ),

    event:
      new UploadEventImageController(
        new UploadEventImage(pool)
      ),

    userProfile:
      new UploadUserProfileImageController(
        new UploadUserProfileImage(pool)
      ),
  };

  return createUploadRoutes(
    controllers,
    tokenService,
    pool
  );
}