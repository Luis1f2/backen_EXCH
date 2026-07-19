import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";
import { removePreviousUpload } from "../../shared/uploadFileUtils.js";

interface EventImageRow {
  imagen_url: string | null;
}

export interface UploadEventImageResult {
  eventoId: string;
  imagenUrl: string;
}

export class UploadEventImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    eventoId: string,
    filename: string
  ): Promise<UploadEventImageResult> {
    const { rows } = await this.pool.query<EventImageRow>(
      `SELECT imagen_url
       FROM evento
       WHERE id = $1
         AND activo = true
       LIMIT 1`,
      [eventoId]
    );

    const event = rows[0];

    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    const imagenUrl = `/uploads/eventos/${filename}`;

    const { rowCount } = await this.pool.query(
      `UPDATE evento
       SET imagen_url = $1
       WHERE id = $2
         AND activo = true`,
      [imagenUrl, eventoId]
    );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("Evento no encontrado", 404);
    }

    await removePreviousUpload(event.imagen_url, "eventos");

    return { eventoId, imagenUrl };
  }
}
