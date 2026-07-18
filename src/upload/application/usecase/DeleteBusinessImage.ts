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
  imagen_url: string | null;
}

export class DeleteBusinessImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    negocioId: string,
    userId: string
  ): Promise<void> {
    const [rows] =
      await this.pool.execute<
        BusinessImageRow[]
      >(
        `SELECT n.imagen_url
         FROM negocio_turistico n
         INNER JOIN negocio_administrador na
           ON na.negocio_id = n.id
         WHERE n.id = ?
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

    const [result] =
      await this.pool.execute<
        ResultSetHeader
      >(
        `UPDATE negocio_turistico
         SET imagen_url = NULL
         WHERE id = ?
           AND activo = 1
           AND esta_verificado = 1`,
        [negocioId]
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Negocio no encontrado",
        404
      );
    }

    await removePreviousUpload(
      business.imagen_url,
      "negocios"
    );
  }
}