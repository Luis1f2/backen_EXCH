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
   const { rows } =
  await this.pool.query<BusinessImageRow>(
    `SELECT
       n.id,
       n.imagen_url
     FROM negocio_administrador na
     INNER JOIN negocio_turistico n
       ON n.id = na.negocio_id
     WHERE na.negocio_id = $1
       AND na.usuario_id = $2
       AND na.rol = 'propietario'
       AND na.activo = true
       AND n.activo = true
     LIMIT 1`,
    [
      negocioId,
      userId
    ]
  );

    const business = rows[0];

    if (!business) {
      throw new AppError(
        "No tienes permisos para modificar la imagen de este negocio",
        403
      );
    }

    const imagenUrl = `/uploads/negocios/${filename}`;

 const { rowCount } =
  await this.pool.query(
    `UPDATE negocio_turistico
     SET imagen_url = $1
     WHERE id = $2
       AND activo = true`,
    [
      imagenUrl,
      negocioId
    ]
  );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("Negocio no encontrado", 404);
    }

    await removePreviousUpload(business.imagen_url, "negocios");

    return { negocioId, imagenUrl };
  }
}
