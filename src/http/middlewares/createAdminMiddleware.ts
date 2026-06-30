import type { NextFunction, Request, Response } from "express";
import type { Pool, RowDataPacket } from "mysql2/promise";

import type { TokenService } from "../../user/application/ports/SecurityPorts.js";
import { AppError } from "../../user/application/errors/AppError.js";
import type { AuthenticatedRequest } from "./AuthenticatedRequest.js";

interface TipoRow extends RowDataPacket {
  nombre: string;
}

export function createAdminMiddleware(
  pool: Pool,
  tokenService: TokenService
) {
  const authenticate = createAuthMiddlewareInternal(tokenService);

  return async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    authenticate(request, response, async (err?: unknown) => {
      if (err) return next(err);

      try {
        const userId = (request as AuthenticatedRequest).userId;

        const [rows] = await pool.execute<TipoRow[]>(
          `SELECT tu.nombre
           FROM usuario u
           JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
           WHERE u.id = ? AND u.activo = 1
           LIMIT 1`,
          [userId]
        );

        if (!rows[0] || rows[0].nombre !== "admin_plataforma") {
          throw new AppError("Acceso restringido a administradores", 403);
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  };
}

function createAuthMiddlewareInternal(tokenService: TokenService) {
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

      (request as AuthenticatedRequest).userId = tokenService.verify(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
