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

interface EventImageRow
  extends RowDataPacket {
  imagen_url: string | null;
}

export class DeleteEventImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    eventoId: string
  ): Promise<void> {
    /*
     * Buscamos el evento y obtenemos
     * la imagen que tiene actualmente.
     */
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

    /*
     * Quitamos primero la referencia
     * de la base de datos.
     */
    const [result] =
      await this.pool.execute<
        ResultSetHeader
      >(
        `UPDATE evento
         SET imagen_url = NULL
         WHERE id = ?
           AND activo = 1`,
        [eventoId]
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Evento no encontrado",
        404
      );
    }

    /*
     * Eliminamos el archivo físico anterior.
     *
     * Si imagen_url ya era NULL,
     * simplemente no hace nada.
     */
    await removePreviousUpload(
      event.imagen_url,
      "eventos"
    );
  }
}