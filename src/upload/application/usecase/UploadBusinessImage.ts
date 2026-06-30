import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { AppError } from "../../../user/application/errors/AppError.js";

export interface UploadBusinessImageResult {
  negocioId: string;
  imagenUrl: string;
}

export class UploadBusinessImage {
  constructor(private readonly pool: Pool) {}

  async execute(
    negocioId: string,
    userId: string,
    filename: string
  ): Promise<UploadBusinessImageResult> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT id FROM negocio_administrador
       WHERE negocio_id = ? AND usuario_id = ? AND activo = 1 LIMIT 1`,
      [negocioId, userId]
    );

    if (!(rows as RowDataPacket[]).length) {
      throw new AppError("No tienes permisos sobre este negocio", 403);
    }

    const imagenUrl = `/uploads/negocios/${filename}`;

    await this.pool.execute<ResultSetHeader>(
      "UPDATE negocio_turistico SET imagen_url = ? WHERE id = ? AND activo = 1",
      [imagenUrl, negocioId]
    );

    return { negocioId, imagenUrl };
  }
}
