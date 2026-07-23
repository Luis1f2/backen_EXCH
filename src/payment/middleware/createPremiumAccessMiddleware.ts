import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import type {
  Pool,
} from 'pg';

import type {
  AuthenticatedRequest,
} from '../../http/middlewares/AuthenticatedRequest.js';

export function createPremiumAccessMiddleware(
  pool: Pool,
) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (request as AuthenticatedRequest)
          .userId;

      const result =
        await pool.query(
          `
          SELECT 1
          FROM negocio_administrador na

          INNER JOIN negocio_turistico n
            ON n.id = na.negocio_id

          INNER JOIN suscripcion_negocio sn
            ON sn.negocio_id =
              na.negocio_id

          WHERE na.usuario_id = $1

            AND na.activo = true

            AND n.activo = true

            AND sn.es_premium = true

            AND sn.estado IN (
              'active',
              'trialing'
            )

          LIMIT 1
          `,
          [
            userId,
          ],
        );

      if (
        (result.rowCount ?? 0) === 0
      ) {
        response.status(403).json({
          success: false,
          message:
            'Esta funcionalidad requiere una suscripción Premium activa',
          code:
            'PREMIUM_REQUIRED',
        });

        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
