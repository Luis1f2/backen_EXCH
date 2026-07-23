import {
  Router,
} from "express";

import type {
  Pool,
} from "pg";

import type {
  TokenService,
} from "../../../user/application/ports/SecurityPorts.js";

import {
  createAuthenticateMiddleware,
} from "../../../http/middlewares/createAuthenticateMiddleware.js";

import {
  createRoleMiddleware,
} from "../../../http/middlewares/createRoleMiddleware.js";

import {
  uploadDestinationProposalImages,
} from "../../../upload/infrastructure/multerConfig.js";

import type {
  DestinationProposalController,
} from "../DestinationProposalController.js";

export function createDestinationProposalRoutes(
  controller:
    DestinationProposalController,

  tokenService:
    TokenService,

  pool:
    Pool,
): Router {
  const router =
    Router();

  const authenticate =
    createAuthenticateMiddleware(
      tokenService,
    );

  const platformAdminOnly =
    createRoleMiddleware(
      pool,
      tokenService,
      [
        "admin_plataforma",
      ],
    );

  router.post(
    "/",
    authenticate,
    controller.create,
  );

  router.get(
    "/mine",
    authenticate,
    controller.mine,
  );

  router.post(
    "/:id/images",
    authenticate,
    uploadDestinationProposalImages.array(
      "imagenes",
      5,
    ),
    controller.uploadImages,
  );

  router.delete(
    "/:id/images/:imageId",
    authenticate,
    controller.deleteImage,
  );

  router.get(
    "/admin",
    platformAdminOnly,
    controller.adminList,
  );

  router.get(
    "/admin/:id",
    platformAdminOnly,
    controller.adminGet,
  );

  router.patch(
    "/:id/review",
    platformAdminOnly,
    controller.review,
  );

  return router;
}
