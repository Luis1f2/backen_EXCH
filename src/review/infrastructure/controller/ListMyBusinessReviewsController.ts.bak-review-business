import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  Pool,
} from "pg";

import type {
  AuthenticatedRequest,
} from "../../../http/middlewares/AuthenticatedRequest.js";

interface BusinessReviewRow {
  id: string;
  user_id: string;
  business_id: string;
  business_name: string;
  rating: number;
  comment: string | null;
  created_at: Date;
}

export class ListMyBusinessReviewsController {
  constructor(
    private readonly pool: Pool,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (request as AuthenticatedRequest)
          .userId;

      const { rows } =
        await this.pool.query<BusinessReviewRow>(
          `
          SELECT
            rn.id,
            rn.usuario_id AS user_id,
            rn.negocio_id AS business_id,
            n.nombre AS business_name,
            rn.calificacion AS rating,
            rn.comentario AS comment,
            rn.fecha AS created_at
          FROM resena_negocio rn
          INNER JOIN negocio_turistico n
            ON n.id = rn.negocio_id
          INNER JOIN negocio_administrador na
            ON na.negocio_id = rn.negocio_id
          WHERE na.usuario_id = $1
            AND na.activo = true
            AND n.activo = true
          ORDER BY rn.fecha DESC
          `,
          [userId],
        );

      response.status(200).json({
        success: true,
        data: rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          businessId: row.business_id,
          businessName: row.business_name,
          rating: Number(row.rating),
          comment: row.comment,
          createdAt: row.created_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}
