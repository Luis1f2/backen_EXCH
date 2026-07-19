import type {
  Pool,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from "../../../user/application/errors/AppError.js";

interface StatsRow extends RowDataPacket {
  total_visualizaciones: number;
  veces_en_rutas: number;
  total_favoritos: number;
  calificacion_promedio: string | number;
  total_resenas: number;
  total_servicios: number;
  promociones_activas: number;
}

export interface BusinessStats {
  negocioId: string;
  totalVisualizaciones: number;
  vecesEnRutas: number;
  totalFavoritos: number;
  calificacionPromedio: number;
  totalResenas: number;
  totalServicios: number;
  promocionesActivas: number;
}

export class GetBusinessStats {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    negocioId: string,
    requestingUserId: string
  ): Promise<BusinessStats> {
    const [ownership] =
      await this.pool.execute<RowDataPacket[]>(
        `SELECT na.id
         FROM negocio_administrador na
         INNER JOIN negocio_turistico n
           ON n.id = na.negocio_id
         WHERE na.negocio_id = ?
           AND na.usuario_id = ?
           AND na.activo = 1
           AND na.estado_solicitud = 'aprobada'
           AND n.activo = 1
           AND n.esta_verificado = 1
         LIMIT 1`,
        [
          negocioId,
          requestingUserId
        ]
      );

    if (ownership.length === 0) {
      throw new AppError(
        "No tienes permisos sobre este negocio",
        403
      );
    }

    const [rows] =
      await this.pool.execute<StatsRow[]>(
        `SELECT
           COALESCE(
             m.total_visualizaciones,
             0
           ) AS total_visualizaciones,

           COALESCE(
             m.veces_en_rutas,
             0
           ) AS veces_en_rutas,

           (
             SELECT COUNT(*)
             FROM favorito_negocio fn
             WHERE fn.negocio_id = n.id
           ) AS total_favoritos,

           (
             SELECT COALESCE(
               AVG(rn.calificacion),
               0
             )
             FROM resena_negocio rn
             WHERE rn.negocio_id = n.id
           ) AS calificacion_promedio,

           (
             SELECT COUNT(*)
             FROM resena_negocio rn
             WHERE rn.negocio_id = n.id
           ) AS total_resenas,

           (
             SELECT COUNT(*)
             FROM negocio_servicio ns
             WHERE ns.negocio_id = n.id
               AND ns.activo = 1
           ) AS total_servicios,

           (
             SELECT COUNT(*)
             FROM promocion p
             WHERE p.negocio_id = n.id
               AND p.activo = 1
               AND p.fecha_inicio
                   <= CURRENT_DATE()
               AND (
                 p.fecha_fin IS NULL
                 OR p.fecha_fin
                    >= CURRENT_DATE()
               )
           ) AS promociones_activas

         FROM negocio_turistico n

         LEFT JOIN negocio_metrica m
           ON m.negocio_id = n.id

         WHERE n.id = ?
           AND n.activo = 1
           AND n.esta_verificado = 1

         LIMIT 1`,
        [negocioId]
      );

    const row = rows[0];

    if (!row) {
      throw new AppError(
        "Negocio no encontrado",
        404
      );
    }

    return {
      negocioId,

      totalVisualizaciones:
        Number(
          row.total_visualizaciones
        ),

      vecesEnRutas:
        Number(
          row.veces_en_rutas
        ),

      totalFavoritos:
        Number(
          row.total_favoritos
        ),

      calificacionPromedio:
        Number(
          row.calificacion_promedio
        ),

      totalResenas:
        Number(
          row.total_resenas
        ),

      totalServicios:
        Number(
          row.total_servicios
        ),

      promocionesActivas:
        Number(
          row.promociones_activas
        )
    };
  }
}