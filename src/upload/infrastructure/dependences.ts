import type { Pool } from
  "mysql2/promise";

import {
  JwtTokenService
} from "../../user/infrastructure/security/SecurityAdapters.js";

import {
  UploadBusinessImage
} from "../application/usecase/UploadBusinessImage.js";

import {
  DeleteBusinessImage
} from "../application/usecase/DeleteBusinessImage.js";

import {
  UploadResenaImage
} from "../application/usecase/UploadResenaImage.js";

import {
  UploadPromotionImage
} from "../application/usecase/UploadPromotionImage.js";

import {
  DeletePromotionImage
} from "../application/usecase/DeletePromotionImage.js";

import {
  UploadEventImage
} from "../application/usecase/UploadEventImage.js";

import {
  DeleteEventImage
} from "../application/usecase/DeleteEventImage.js";

import {
  UploadUserProfileImage
} from "../application/usecase/UploadUserProfileImage.js";

import {
  DeleteUserProfileImage
} from "../application/usecase/DeleteUserProfileImage.js";

import {
  UploadBusinessImageController
} from "./controller/UploadBusinessImageController.js";

import {
  DeleteBusinessImageController
} from "./controller/DeleteBusinessImageController.js";

import {
  UploadResenaImageController
} from "./controller/UploadResenaImageController.js";

import {
  UploadPromotionImageController
} from "./controller/UploadPromotionImageController.js";

import {
  DeletePromotionImageController
} from "./controller/DeletePromotionImageController.js";

import {
  UploadEventImageController
} from "./controller/UploadEventImageController.js";

import {
  DeleteEventImageController
} from "./controller/DeleteEventImageController.js";

import {
  UploadUserProfileImageController
} from "./controller/UploadUserProfileImageController.js";

import {
  DeleteUserProfileImageController
} from "./controller/DeleteUserProfileImageController.js";

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

    deletePromotion:
    new DeletePromotionImageController(
      new DeletePromotionImage(pool)
    ),

    event:
      new UploadEventImageController(
        new UploadEventImage(pool)
      ),

    deleteEvent:
    new DeleteEventImageController(
      new DeleteEventImage(pool)
    ),

  deleteBusiness:
    new DeleteBusinessImageController(
      new DeleteBusinessImage(pool)
    ),

    userProfile:
      new UploadUserProfileImageController(
        new UploadUserProfileImage(pool)
      ),

      deleteUserProfile:
    new DeleteUserProfileImageController(
      new DeleteUserProfileImage(pool)
    ),

  };

  return createUploadRoutes(
    controllers,
    tokenService,
    pool
  );
}