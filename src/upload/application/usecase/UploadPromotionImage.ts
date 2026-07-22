import type { Pool } from "pg";

import type {
  ImageStorage,
} from "../ports/ImageStorage.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import {
  removePreviousUpload,
} from "../../shared/uploadFileUtils.js";

interface PromotionImageRow {
  imagen_url: string | null;
}

export interface UploadPromotionImageResult {
  promocionId: string;
  imagenUrl: string;
}

export class UploadPromotionImage {
  constructor(
    private readonly pool: Pool,
    private readonly imageStorage: ImageStorage
  ) {}

  async execute(
    promocionId: string,
    userId: string,
    buffer: Buffer
  ): Promise<UploadPromotionImageResult> {
    const { rows } =
      await this.pool.query<PromotionImageRow>(
        `SELECT p.imagen_url
         FROM promocion p
         INNER JOIN negocio_turistico n
           ON n.id = p.negocio_id
         INNER JOIN negocio_administrador na
           ON na.negocio_id = p.negocio_id
         WHERE p.id = $1
           AND p.activo = true
           AND na.usuario_id = $2
           AND na.activo = true
           AND na.estado_solicitud = 'aprobado'
           AND n.activo = true
           AND n.esta_verificado = true
         LIMIT 1`,
        [
          promocionId,
          userId,
        ]
      );

    const promotion = rows[0];

    if (!promotion) {
      throw new AppError(
        "No tienes permisos sobre esta promoción",
        403
      );
    }

    const uploaded =
      await this.imageStorage.upload(
        buffer,
        "promociones"
      );

    try {
      const { rowCount } =
        await this.pool.query(
          `UPDATE promocion
           SET imagen_url = $1
           WHERE id = $2
             AND activo = true`,
          [
            uploaded.url,
            promocionId,
          ]
        );

      if ((rowCount ?? 0) === 0) {
        throw new AppError(
          "Promoción no encontrada",
          404
        );
      }
    } catch (error) {
      await this.imageStorage
        .delete(uploaded.publicId)
        .catch(() => undefined);

      throw error;
    }

    await removePreviousUpload(
      promotion.imagen_url,
      "promociones",
      this.imageStorage
    );

    return {
      promocionId,
      imagenUrl: uploaded.url,
    };
  }
}