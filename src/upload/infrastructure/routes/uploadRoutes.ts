import { Router } from "express";

import type { TokenService } from "../../../user/application/ports/SecurityPorts.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

import { uploadNegocio, uploadResena } from "../multerConfig.js";

import type { UploadBusinessImageController } from "../controller/UploadBusinessImageController.js";
import type { UploadResenaImageController } from "../controller/UploadResenaImageController.js";

interface UploadControllers {
  business: UploadBusinessImageController;
  resena: UploadResenaImageController;
}

export function createUploadRoutes(
  controllers: UploadControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.post(
    "/negocios/:negocioId",
    authenticate,
    uploadNegocio.single("imagen"),
    controllers.business.execute
  );

  router.post(
    "/resenas/:resenaId",
    authenticate,
    uploadResena.single("imagen"),
    controllers.resena.execute
  );

  return router;
}
