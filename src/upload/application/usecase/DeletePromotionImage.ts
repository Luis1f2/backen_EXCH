import type {
  Pool,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from
  "../../../user/application/errors/AppError.js";

import {
  removePreviousUpload
} from "../../shared/uploadFileUtils.js";

interface PromotionImageRow
  extends RowDataPacket {
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
    /*
     * Verificamos:
     * - que la promoción exista;
     * - que esté activa;
     * - que el usuario administre el negocio;
     * - que la administración esté aprobada;
     * - que el negocio esté activo y verificado.
     */
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

    /*
     * Primero quitamos la referencia
     * de la base de datos.
     */
    await this.pool.execute(
      `UPDATE promocion
       SET imagen_url = NULL
       WHERE id = ?
         AND activo = 1`,
      [promocionId]
    );

    /*
     * Después eliminamos el archivo anterior.
     *
     * Si imagen_url ya era NULL,
     * removePreviousUpload no hace nada.
     */
    await removePreviousUpload(
      promotion.imagen_url,
      "promociones"
    );
  }
}