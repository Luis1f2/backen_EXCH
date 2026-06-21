import {
  Router,
  type NextFunction,
  type Request,
  type Response
} from "express";

import type { TokenService } from "../../applications/ports/SecurityPorts.js";
import { AppError } from "../../applications/errors/AppError.js";

import type { AuthenticatedRequest } from "../controller/AuthenticatedRequest.js";
import type { RegisterUserController } from "../controller/RegisterUserController.js";
import type { LoginUserController } from "../controller/LoginUserController.js";
import type { GetUserProfileController } from "../controller/GetUserProfileController.js";
import type { UpdateUserProfileController } from "../controller/UpdateUserProfileController.js";
import type { DeleteUserProfileController } from "../controller/DeleteUserProfileController.js";

interface UserControllers {
  register: RegisterUserController;
  login: LoginUserController;
  getProfile: GetUserProfileController;
  updateProfile: UpdateUserProfileController;
  deleteProfile: DeleteUserProfileController;
}

export function createUserRoutes(
  controllers: UserControllers,
  tokenService: TokenService
): Router {
  const router = Router();

  const authenticate = (
    request: Request,
    _response: Response,
    next: NextFunction
  ): void => {
    try {
      const authorization = request.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        throw new AppError("Token requerido", 401);
      }

      const token = authorization.slice(7).trim();

      if (!token) {
        throw new AppError("Token requerido", 401);
      }

      const userId = tokenService.verify(token);

      (request as AuthenticatedRequest).userId = userId;

      next();
    } catch (error) {
      next(error);
    }
  };

  router.post("/register", controllers.register.execute);
  router.post("/login", controllers.login.execute);

  router.get(
    "/profile",
    authenticate,
    controllers.getProfile.execute
  );

  router.patch(
    "/profile",
    authenticate,
    controllers.updateProfile.execute
  );

  router.delete(
    "/profile",
    authenticate,
    controllers.deleteProfile.execute
  );

  return router;
}