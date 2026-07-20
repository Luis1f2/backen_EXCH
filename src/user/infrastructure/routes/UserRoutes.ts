import { Router } from "express";

import type { TokenService } from "../../application/ports/SecurityPorts.js";

import type { RegisterUserController } from "../controller/RegisterUserController.js";
import type { LoginUserController } from "../controller/LoginUserController.js";
import type { GetUserProfileController } from "../controller/GetUserProfileController.js";
import type { UpdateUserProfileController } from "../controller/UpdateUserProfileController.js";
import type { DeleteUserProfileController } from "../controller/DeleteUserProfileController.js";
import type {
  GetUserInterestsController
} from "../controller/GetUserInterestsController.js";

import type {
  UpdateUserInterestsController
} from "../controller/UpdateUserInterestsController.js";

import { createAuthenticateMiddleware } from "../../../http/middlewares/createAuthenticateMiddleware.js";

interface UserControllers {
 register: RegisterUserController;
  login: LoginUserController;
  getProfile: GetUserProfileController;
  updateProfile: UpdateUserProfileController;
  deleteProfile: DeleteUserProfileController;

  getUserInterests: GetUserInterestsController;
  updateUserInterests: UpdateUserInterestsController;
}

export function createUserRoutes(
  controllers: UserControllers,
  tokenService: TokenService
): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.post("/register", controllers.register.execute);
  router.post("/login", controllers.login.execute);
  router.get("/interests",authenticate,controllers.getUserInterests.execute);
  router.put("/interests",authenticate,controllers.updateUserInterests.execute);

  router.get("/profile", authenticate, controllers.getProfile.execute);
  router.patch("/profile", authenticate, controllers.updateProfile.execute);
  router.delete("/profile", authenticate, controllers.deleteProfile.execute);

  return router;
}