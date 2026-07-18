import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from
  "../../../user/application/errors/AppError.js";

import { removePreviousUpload } from
  "../../shared/uploadFileUtils.js";

interface EventImageRow
  extends RowDataPacket {
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
    const [rows] =
      await this.pool.execute<
        EventImageRow[]
      >(
        `SELECT imagen_url
         FROM evento
         WHERE id = ?
           AND activo = 1
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

    const imagenUrl =
      `/uploads/eventos/${filename}`;

    const [result] =
      await this.pool.execute<
        ResultSetHeader
      >(
        `UPDATE evento
         SET imagen_url = ?
         WHERE id = ?
           AND activo = 1`,
        [
          imagenUrl,
          eventoId
        ]
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Evento no encontrado",
        404
      );
    }

    await removePreviousUpload(
      event.imagen_url,
      "eventos"
    );

    return {
      eventoId,
      imagenUrl
    };
  }
}