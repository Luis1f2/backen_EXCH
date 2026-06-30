import type { Pool, RowDataPacket } from "mysql2/promise";

import type { Destino } from "../../domain/entities/Destino.js";

import type {
  BusquedaCercanos,
  DestinoRepository
} from "../../domain/repositories/DestinoRepository.js";

interface DestinoRow extends RowDataPacket {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  latitud: number;
  longitud: number;
  calificacion_promedio: number;
  afluencia: number;
  es_sostenible: number;
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
  WHERE d.activo = 1
`;

export class MySqlDestinoRepository implements DestinoRepository {
  constructor(private readonly databasePool: Pool) {}

  async listar(tipo?: string): Promise<Destino[]> {
    let query = SELECT_BASE;
    const values: string[] = [];

    if (tipo) {
      query += " AND c.nombre = ?";
      values.push(tipo);
    }

    query += " ORDER BY d.nombre";

    const [rows] = await this.databasePool.execute<DestinoRow[]>(query, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async listarCercanos(busqueda: BusquedaCercanos): Promise<Destino[]> {
    let subquery = SELECT_BASE;
    const subqueryValues: string[] = [];

    if (busqueda.tipo) {
      subquery += " AND c.nombre = ?";
      subqueryValues.push(busqueda.tipo);
    }

    // Formula de Haversine: distancia entre dos puntos sobre la esfera
    // terrestre (radio promedio 6371 km) a partir de su latitud/longitud.
    const distanciaKm = `(
      6371 * ACOS(
        COS(RADIANS(?)) * COS(RADIANS(latitud)) *
        COS(RADIANS(longitud) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(latitud))
      )
    )`;

    const query = `
      SELECT *, ${distanciaKm} AS distancia_km
      FROM (${subquery}) AS destinos
      HAVING distancia_km <= ?
      ORDER BY distancia_km ASC
    `;

    const values = [
      busqueda.lat,
      busqueda.lng,
      busqueda.lat,
      ...subqueryValues,
      busqueda.radioKm
    ];

    const [rows] = await this.databasePool.execute<DestinoRow[]>(query, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async obtenerPorId(id: string): Promise<Destino | null> {
    const query = `${SELECT_BASE} AND d.id = ? LIMIT 1`;
    const [rows] = await this.databasePool.execute<DestinoRow[]>(query, [id]);

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
