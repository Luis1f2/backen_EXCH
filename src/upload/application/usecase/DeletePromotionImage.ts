import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";
import { removePreviousUpload } from "../../shared/uploadFileUtils.js";

interface PromotionImageRow {
  imagen_url: string | null;
}

export class DeletePromotionImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    promocionId: string,
    userId: string
  ): Promise<void> {
    const { rows } = await this.pool.query<PromotionImageRow>(
      `SELECT p.imagen_url
       FROM promocion p
       INNER JOIN negocio_turistico n ON n.id = p.negocio_id
       INNER JOIN negocio_administrador na ON na.negocio_id = p.negocio_id
       WHERE p.id = $1
         AND p.activo = true
         AND na.usuario_id = $2
         AND na.activo = true
         AND na.estado_solicitud = 'aprobado'
         AND n.activo = true
         AND n.esta_verificado = true
       LIMIT 1`,
      [promocionId, userId]
    );

    const promotion = rows[0];

    if (!promotion) {
      throw new AppError("No tienes permisos sobre esta promoción", 403);
    }

    await this.pool.query(
      `UPDATE promocion
       SET imagen_url = NULL
       WHERE id = $1
         AND activo = true`,
      [promocionId]
    );

    await removePreviousUpload(promotion.imagen_url, "promociones");
  }
}
