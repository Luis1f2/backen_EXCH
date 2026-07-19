import { Router } from "express";

import type { Pool } from
  "pg";

import type {
  TokenService
} from "../../../user/application/ports/SecurityPorts.js";

import {
  createAuthenticateMiddleware
} from "../../../http/middlewares/createAuthenticateMiddleware.js";

import {
  createAdminMiddleware
} from "../../../http/middlewares/createAdminMiddleware.js";

import {
  uploadNegocio,
  uploadResena,
  uploadPromocion,
  uploadEvento,
  uploadUsuario
} from "../multerConfig.js";

import type {
  UploadBusinessImageController
} from "../controller/UploadBusinessImageController.js";

import type {
  UploadResenaImageController
} from "../controller/UploadResenaImageController.js";

import type {
  UploadPromotionImageController
} from "../controller/UploadPromotionImageController.js";

import type {
  DeletePromotionImageController
} from "../controller/DeletePromotionImageController.js";

import type {
  UploadEventImageController
} from "../controller/UploadEventImageController.js";

import type {
  DeleteEventImageController
} from "../controller/DeleteEventImageController.js";

import type {
  UploadUserProfileImageController
} from "../controller/UploadUserProfileImageController.js";

import type {
  DeleteBusinessImageController
} from "../controller/DeleteBusinessImageController.js";


//Elimina imagen perfil

import type {
  DeleteUserProfileImageController
} from "../controller/DeleteUserProfileImageController.js";

interface UploadControllers {
  business:
    UploadBusinessImageController;

  resena:
    UploadResenaImageController;

  promotion:
    UploadPromotionImageController;

  
  deletePromotion:
    DeletePromotionImageController;


  event:
    UploadEventImageController;

  deleteEvent:
    DeleteEventImageController;

  userProfile:
    UploadUserProfileImageController;

  deleteUserProfile:
  DeleteUserProfileImageController;

  deleteBusiness:
  DeleteBusinessImageController;
}

export function createUploadRoutes(
  controllers: UploadControllers,
  tokenService: TokenService,
  pool: Pool
): Router {
  const router = Router();

  const authenticate =
    createAuthenticateMiddleware(
      tokenService
    );

  const platformAdminOnly =
    createAdminMiddleware(
      pool,
      tokenService
    );

  router.post(
    "/negocios/:negocioId",
    authenticate,
    uploadNegocio.single("imagen"),
    controllers.business.execute
  );

  router.delete(
    "/negocios/:negocioId",
    authenticate,
    controllers.deleteBusiness.execute
  );

  router.post(
    "/resenas/:resenaId",
    authenticate,
    uploadResena.single("imagen"),
    controllers.resena.execute
  );

  router.post(
    "/promociones/:promocionId",
    authenticate,
    uploadPromocion.single("imagen"),
    controllers.promotion.execute
  );

  router.delete(
    "/promociones/:promocionId",
    authenticate,
    controllers.deletePromotion.execute
  );

  router.post(
    "/eventos/:eventoId",
    platformAdminOnly,
    uploadEvento.single("imagen"),
    controllers.event.execute
  );

  router.delete(
    "/eventos/:eventoId",
    platformAdminOnly,
    controllers.deleteEvent.execute
  );

router.post(
  "/usuarios/perfil",
  authenticate,
  uploadUsuario.single("imagen"),
  controllers.userProfile.execute
);

router.delete(
  "/usuarios/perfil",
  authenticate,
  controllers.deleteUserProfile.execute
);

  return router;
}