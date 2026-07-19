import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from
  "../../../user/application/errors/AppError.js";

import {
  removePreviousUpload
} from "../../shared/uploadFileUtils.js";

interface BusinessImageRow
  extends RowDataPacket {
  id: string;
  imagen_url: string | null;
}

export interface UploadBusinessImageResult {
  negocioId: string;
  imagenUrl: string;
}

export class UploadBusinessImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    negocioId: string,
    userId: string,
    filename: string
  ): Promise<UploadBusinessImageResult> {
    const [rows] =
      await this.pool.execute<
        BusinessImageRow[]
      >(
        `SELECT
           na.id,
           n.imagen_url
         FROM negocio_administrador na
         INNER JOIN negocio_turistico n
           ON n.id = na.negocio_id
         WHERE na.negocio_id = ?
           AND na.usuario_id = ?
           AND na.activo = 1
           AND na.estado_solicitud = 'aprobada'
           AND n.activo = 1
           AND n.esta_verificado = 1
         LIMIT 1`,
        [
          negocioId,
          userId
        ]
      );

    const business = rows[0];

    if (!business) {
      throw new AppError(
        "El negocio debe estar aprobado y debes ser su administrador",
        403
      );
    }

    const imagenUrl =
      `/uploads/negocios/${filename}`;

    const [result] =
      await this.pool.execute<
        ResultSetHeader
      >(
        `UPDATE negocio_turistico
         SET imagen_url = ?
         WHERE id = ?
           AND activo = 1
           AND esta_verificado = 1`,
        [
          imagenUrl,
          negocioId
        ]
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Negocio no encontrado",
        404
      );
    }

    /*
     * Si el negocio ya tenía otra imagen,
     * eliminamos el archivo anterior después
     * de actualizar correctamente la BD.
     */
    await removePreviousUpload(
      business.imagen_url,
      "negocios"
    );

    return {
      negocioId,
      imagenUrl
    };
  }
}