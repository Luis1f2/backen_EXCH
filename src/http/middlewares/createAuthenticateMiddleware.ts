import type {
  NextFunction,
  Request,
  Response
} from "express";

import type { TokenService } from "../../user/applications/ports/SecurityPorts.js";
import { AppError } from "../../user/applications/errors/AppError.js";

import type { AuthenticatedRequest } from "./AuthenticatedRequest.js";

export function createAuthenticateMiddleware(
  tokenService: TokenService
) {
  return (
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

      (request as AuthenticatedRequest).userId =
        tokenService.verify(token);

      next();
    } catch (error) {
      next(error);
    }
  };
}