import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from
  "../../../user/application/errors/AppError.js";

import { removePreviousUpload } from
  "../../shared/uploadFileUtils.js";

interface PromotionImageRow
  extends RowDataPacket {
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
    const [rows] =
      await this.pool.execute<
        PromotionImageRow[]
      >(
        `SELECT p.imagen_url
         FROM promocion p
         INNER JOIN negocio_turistico n
           ON n.id = p.negocio_id
         INNER JOIN negocio_administrador na
           ON na.negocio_id = p.negocio_id
         WHERE p.id = ?
           AND p.activo = 1
           AND na.usuario_id = ?
           AND na.activo = 1
           AND na.estado_solicitud = 'aprobada'
           AND n.activo = 1
           AND n.esta_verificado = 1
         LIMIT 1`,
        [
          promocionId,
          userId
        ]
      );

    const promotion = rows[0];

    if (!promotion) {
      throw new AppError(
        "No tienes permisos sobre esta promoción",
        403
      );
    }

    const imagenUrl =
      `/uploads/promociones/${filename}`;

    const [result] =
      await this.pool.execute<
        ResultSetHeader
      >(
        `UPDATE promocion
         SET imagen_url = ?
         WHERE id = ?
           AND activo = 1`,
        [
          imagenUrl,
          promocionId
        ]
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Promoción no encontrada",
        404
      );
    }

    await removePreviousUpload(
      promotion.imagen_url,
      "promociones"
    );

    return {
      promocionId,
      imagenUrl
    };
  }
}