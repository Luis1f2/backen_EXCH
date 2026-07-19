import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { Pool } from "pg";

import type { TokenService } from "../../user/application/ports/SecurityPorts.js";
import { AppError } from "../../user/application/errors/AppError.js";
import type { AuthenticatedRequest } from "./AuthenticatedRequest.js";

interface UserRoleRow {
  tipo_usuario: string;
}

export function createRoleMiddleware(
  pool: Pool,
  tokenService: TokenService,
  allowedRoles: string[],
) {
  return async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
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

      const { rows } = await pool.query<UserRoleRow>(
        `SELECT tu.nombre AS tipo_usuario
         FROM usuario u
         INNER JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
         WHERE u.id = $1
           AND u.activo = true
         LIMIT 1`,
        [userId],
      );

      const user = rows[0];

      if (!user) {
        throw new AppError("Usuario no encontrado o inactivo", 401);
      }

      if (!allowedRoles.includes(user.tipo_usuario)) {
        throw new AppError("No tienes permisos para realizar esta operación", 403);
      }

      (request as AuthenticatedRequest).userId = userId;

      next();
    } catch (error) {
      next(error);
    }
  };
}
