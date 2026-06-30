import { randomUUID } from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { AppError } from "../../../user/application/errors/AppError.js";

export type ResenaType = "resena_destino" | "resena_negocio" | "resena_ubicacion";

export interface UploadResenaImageResult {
  id: string;
  resenaId: string;
  tipo: ResenaType;
  imagenUrl: string;
}

export class UploadResenaImage {
  constructor(private readonly pool: Pool) {}

  async execute(
    resenaId: string,
    tipo: ResenaType,
    userId: string,
    filename: string
  ): Promise<UploadResenaImageResult> {
    const [tipoRows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT id FROM tipo_entidad_resena WHERE nombre = ? LIMIT 1",
      [tipo]
    );

    const tipoRow = (tipoRows as RowDataPacket[])[0];

    if (!tipoRow) {
      throw new AppError("Tipo de resena no valido", 400);
    }

    const imagenUrl = `/uploads/resenas/${filename}`;
    const fotoId = randomUUID();

    await this.pool.execute(
      `INSERT INTO fotografia_resena (id, resena_tipo_id, resena_id, usuario_id, url_imagen)
       VALUES (?, ?, ?, ?, ?)`,
      [fotoId, tipoRow.id as string, resenaId, userId, imagenUrl]
    );

    return { id: fotoId, resenaId, tipo, imagenUrl };
  }
}
