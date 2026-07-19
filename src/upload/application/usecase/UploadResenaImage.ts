import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
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
    const { rows } = await this.pool.query<{ id: string }>(
      "SELECT id FROM tipo_entidad_resena WHERE nombre = $1 LIMIT 1",
      [tipo]
    );

    const tipoRow = rows[0];

    if (!tipoRow) {
      throw new AppError("Tipo de resena no valido", 400);
    }

    const imagenUrl = `/uploads/resenas/${filename}`;
    const fotoId = randomUUID();

    await this.pool.query(
      `INSERT INTO fotografia_resena (id, resena_tipo_id, resena_id, usuario_id, url_imagen)
       VALUES ($1, $2, $3, $4, $5)`,
      [fotoId, tipoRow.id, resenaId, userId, imagenUrl]
    );

    return { id: fotoId, resenaId, tipo, imagenUrl };
  }
}
