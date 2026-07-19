import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";
import { removePreviousUpload } from "../../shared/uploadFileUtils.js";

interface BusinessImageRow {
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
    const { rows } = await this.pool.query<BusinessImageRow>(
      `SELECT n.imagen_url
       FROM negocio_turistico n
       INNER JOIN negocio_administrador na ON na.negocio_id = n.id
       WHERE n.id = $1
         AND na.usuario_id = $2
         AND na.activo = true
         AND na.estado_solicitud = 'aprobada'
         AND n.activo = true
         AND n.esta_verificado = true
       LIMIT 1`,
      [negocioId, userId]
    );

    const business = rows[0];

    if (!business) {
      throw new AppError(
        "El negocio debe estar aprobado y debes ser su administrador",
        403
      );
    }

    const { rowCount } = await this.pool.query(
      `UPDATE negocio_turistico
       SET imagen_url = NULL
       WHERE id = $1
         AND activo = true
         AND esta_verificado = true`,
      [negocioId]
    );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("Negocio no encontrado", 404);
    }

    await removePreviousUpload(business.imagen_url, "negocios");
  }
}
