import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";
import { removePreviousUpload } from "../../shared/uploadFileUtils.js";

interface PromotionImageRow {
  imagen_url: string | null;
}

export interface UploadPromotionImageResult {
  promocionId: string;
  imagenUrl: string;
}

export class UploadPromotionImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    promocionId: string,
    userId: string,
    filename: string
  ): Promise<UploadPromotionImageResult> {
    const { rows } = await this.pool.query<PromotionImageRow>(
      `SELECT p.imagen_url
       FROM promocion p
       INNER JOIN negocio_turistico n ON n.id = p.negocio_id
       INNER JOIN negocio_administrador na ON na.negocio_id = p.negocio_id
       WHERE p.id = $1
         AND p.activo = true
         AND na.usuario_id = $2
         AND na.activo = true
         AND na.estado_solicitud = 'aprobada'
         AND n.activo = true
         AND n.esta_verificado = true
       LIMIT 1`,
      [promocionId, userId]
    );

    const promotion = rows[0];

    if (!promotion) {
      throw new AppError("No tienes permisos sobre esta promoción", 403);
    }

    const imagenUrl = `/uploads/promociones/${filename}`;

    const { rowCount } = await this.pool.query(
      `UPDATE promocion
       SET imagen_url = $1
       WHERE id = $2
         AND activo = true`,
      [imagenUrl, promocionId]
    );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("Promoción no encontrada", 404);
    }

    await removePreviousUpload(promotion.imagen_url, "promociones");

    return { promocionId, imagenUrl };
  }
}
