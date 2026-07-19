import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";
import { removePreviousUpload } from "../../shared/uploadFileUtils.js";

interface BusinessImageRow {
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
    const { rows } = await this.pool.query<BusinessImageRow>(
      `SELECT na.id, n.imagen_url
       FROM negocio_administrador na
       INNER JOIN negocio_turistico n ON n.id = na.negocio_id
       WHERE na.negocio_id = $1
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

    const imagenUrl = `/uploads/negocios/${filename}`;

    const { rowCount } = await this.pool.query(
      `UPDATE negocio_turistico
       SET imagen_url = $1
       WHERE id = $2
         AND activo = true
         AND esta_verificado = true`,
      [imagenUrl, negocioId]
    );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("Negocio no encontrado", 404);
    }

    await removePreviousUpload(business.imagen_url, "negocios");

    return { negocioId, imagenUrl };
  }
}
