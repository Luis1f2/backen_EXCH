import type { Pool, RowDataPacket } from "mysql2/promise";
import { AppError } from "../../../user/application/errors/AppError.js";

interface StatsRow extends RowDataPacket {
  total_favoritos: number;
  calificacion_promedio: number;
  total_resenas: number;
}

interface RouteRow extends RowDataPacket {
  veces_en_rutas: number;
}

export interface BusinessStats {
  negocioId: string;
  totalFavoritos: number;
  calificacionPromedio: number;
  totalResenas: number;
}

export class GetBusinessStats {
  constructor(private readonly pool: Pool) {}

  async execute(
    negocioId: string,
    requestingUserId: string
  ): Promise<BusinessStats> {
    const [ownership] = await this.pool.execute<RowDataPacket[]>(
      `SELECT id FROM negocio_administrador
       WHERE negocio_id = ? AND usuario_id = ? AND activo = 1
       LIMIT 1`,
      [negocioId, requestingUserId]
    );

    if (!(ownership as RowDataPacket[]).length) {
      throw new AppError("No tienes permisos sobre este negocio", 403);
    }

    const [rows] = await this.pool.execute<StatsRow[]>(
      `SELECT
         (SELECT COUNT(*) FROM favorito_negocio WHERE negocio_id = ?) AS total_favoritos,
         COALESCE(m.calificacion_promedio, 0) AS calificacion_promedio,
         COALESCE(m.total_resenas, 0) AS total_resenas
       FROM negocio_turistico n
       LEFT JOIN negocio_metrica m ON m.negocio_id = n.id
       WHERE n.id = ? AND n.activo = 1
       LIMIT 1`,
      [negocioId, negocioId]
    );

    const row = rows[0];

    if (!row) {
      throw new AppError("Negocio no encontrado", 404);
    }

    return {
      negocioId,
      totalFavoritos: Number(row.total_favoritos),
      calificacionPromedio: Number(row.calificacion_promedio),
      totalResenas: Number(row.total_resenas)
    };
  }
}
