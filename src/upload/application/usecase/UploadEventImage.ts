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

interface EventImageRow {
  imagen_url: string | null;
}

export interface UploadEventImageResult {
  eventoId: string;
  imagenUrl: string;
}

export class UploadEventImage {
  constructor(
    private readonly pool: Pool,
    private readonly imageStorage: ImageStorage
  ) {}

  async execute(
    eventoId: string,
    buffer: Buffer
  ): Promise<UploadEventImageResult> {
    const { rows } =
      await this.pool.query<EventImageRow>(
        `SELECT imagen_url
         FROM evento
         WHERE id = $1
           AND activo = true
         LIMIT 1`,
        [eventoId]
      );

    const event = rows[0];

    if (!event) {
      throw new AppError(
        "Evento no encontrado",
        404
      );
    }

    const uploaded =
      await this.imageStorage.upload(
        buffer,
        "eventos"
      );

    try {
      const { rowCount } =
        await this.pool.query(
          `UPDATE evento
           SET imagen_url = $1
           WHERE id = $2
             AND activo = true`,
          [
            uploaded.url,
            eventoId,
          ]
        );

      if ((rowCount ?? 0) === 0) {
        throw new AppError(
          "Evento no encontrado",
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
      event.imagen_url,
      "eventos",
      this.imageStorage
    );

    return {
      eventoId,
      imagenUrl: uploaded.url,
    };
  }
}