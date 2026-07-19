import type { Pool } from "pg";

import type { Destino } from "../../domain/entities/Destino.js";

import type {
  BusquedaCercanos,
  DestinoRepository
} from "../../domain/repositories/DestinoRepository.js";

interface DestinoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  latitud: number;
  longitud: number;
  calificacion_promedio: number;
  afluencia: number;
  es_sostenible: boolean;
}

const SELECT_BASE = `
  SELECT
    d.id,
    d.nombre,
    d.descripcion,
    c.nombre AS categoria,
    u.latitud,
    u.longitud,
    COALESCE(m.calificacion_promedio, 0) AS calificacion_promedio,
    COALESCE(m.afluencia, 0) AS afluencia,
    d.es_sostenible
  FROM destino d
  JOIN categoria c ON c.id = d.categoria_id
  JOIN ubicacion u ON u.id = d.ubicacion_id
  LEFT JOIN destino_metrica m ON m.destino_id = d.id
  WHERE d.activo = true
`;

export class MySqlDestinoRepository implements DestinoRepository {
  constructor(private readonly databasePool: Pool) {}

  async listar(tipo?: string): Promise<Destino[]> {
    let query = SELECT_BASE;
    const values: string[] = [];
    let p = 0;

    if (tipo) {
      query += ` AND c.nombre = $${++p}`;
      values.push(tipo);
    }

    query += " ORDER BY d.nombre";

    const { rows } = await this.databasePool.query<DestinoRow>(query, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async listarCercanos(busqueda: BusquedaCercanos): Promise<Destino[]> {
    const values: (string | number)[] = [
      busqueda.lat,
      busqueda.lng,
      busqueda.lat
    ];
    let p = 3;

    let subquery = SELECT_BASE;

    if (busqueda.tipo) {
      subquery += ` AND c.nombre = $${++p}`;
      values.push(busqueda.tipo);
    }

    values.push(busqueda.radioKm);
    const radioIdx = ++p;

    // Formula de Haversine: distancia entre dos puntos sobre la esfera
    // terrestre (radio promedio 6371 km) a partir de su latitud/longitud.
    const distanciaKm = `(
      6371 * ACOS(
        COS(RADIANS($1)) * COS(RADIANS(latitud)) *
        COS(RADIANS(longitud) - RADIANS($2)) +
        SIN(RADIANS($3)) * SIN(RADIANS(latitud))
      )
    )`;

    const query = `
      SELECT * FROM (
        SELECT *, ${distanciaKm} AS distancia_km
        FROM (${subquery}) AS destinos
      ) AS con_distancia
      WHERE distancia_km <= $${radioIdx}
      ORDER BY distancia_km ASC
    `;

    const { rows } = await this.databasePool.query<DestinoRow>(query, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async obtenerPorId(id: string): Promise<Destino | null> {
    const query = `${SELECT_BASE} AND d.id = $1 LIMIT 1`;
    const { rows } = await this.databasePool.query<DestinoRow>(query, [id]);

    const row = rows[0];
    return row ? this.mapToDomain(row) : null;
  }

  private mapToDomain(row: DestinoRow): Destino {
    return {
      id: row.id,
      nombre: row.nombre,
      tipo: row.categoria,
      descripcion: row.descripcion ?? "",
      lat: Number(row.latitud),
      lng: Number(row.longitud),
      calificacion: Number(row.calificacion_promedio),
      afluencia: Number(row.afluencia),
      esSostenible: Boolean(row.es_sostenible)
    };
  }
}
