import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type { Destination } from "../../domain/entities/Destination.js";

import type {
  CreateDestinationData,
  DestinationRepository,
  ListDestinationsFilters,
  UpdateDestinationData
} from "../../domain/repositories/DestinationRepository.js";

interface DestinationRow extends RowDataPacket {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  ubicacion_id: string;
  activo: number;
  fecha_creacion: Date;
  calificacion_promedio: string;
  total_resenas: number;
  es_destino_saturado: number;
}

interface CatalogRow extends RowDataPacket {
  id: string;
}

interface ExistsRow extends RowDataPacket {
  total: number;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlDestinationRepository
  implements DestinationRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateDestinationData): Promise<Destination> {
    await this.databasePool.execute(
      `INSERT INTO destino (
        id,
        nombre,
        descripcion,
        categoria_id,
        ubicacion_id
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description,
        data.categoryId,
        data.locationId
      ]
    );

    await this.databasePool.execute(
      `INSERT INTO destino_metrica (
        destino_id
      ) VALUES (?)`,
      [data.id]
    );

    const destination = await this.findById(data.id);

    if (!destination) {
      throw new Error("No se pudo recuperar el destino creado");
    }

    return destination;
  }

  async findById(id: string): Promise<Destination | null> {
    const [rows] = await this.databasePool.execute<DestinationRow[]>(
      `SELECT
        d.id,
        d.nombre,
        d.descripcion,
        d.categoria_id,
        d.ubicacion_id,
        d.activo,
        d.fecha_creacion,
        COALESCE(dm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(dm.total_resenas, 0) AS total_resenas,
        COALESCE(dm.es_destino_saturado, 0) AS es_destino_saturado
       FROM destino d
       LEFT JOIN destino_metrica dm ON dm.destino_id = d.id
       WHERE d.id = ?
       AND d.activo = 1
       LIMIT 1`,
      [id]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async list(
    filters: ListDestinationsFilters
  ): Promise<Destination[]> {
    const conditions: string[] = ["d.activo = 1"];
    const values: SqlValue[] = [];

    if (filters.categoryId) {
      conditions.push("d.categoria_id = ?");
      values.push(filters.categoryId);
    }

    if (filters.locationId) {
      conditions.push("d.ubicacion_id = ?");
      values.push(filters.locationId);
    }

    if (filters.municipality) {
      conditions.push("u.municipio = ?");
      values.push(filters.municipality);
    }

    if (filters.state) {
      conditions.push("u.estado = ?");
      values.push(filters.state);
    }

    values.push(filters.limit);
    values.push(filters.offset);

    const [rows] = await this.databasePool.execute<DestinationRow[]>(
      `SELECT
        d.id,
        d.nombre,
        d.descripcion,
        d.categoria_id,
        d.ubicacion_id,
        d.activo,
        d.fecha_creacion,
        COALESCE(dm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(dm.total_resenas, 0) AS total_resenas,
        COALESCE(dm.es_destino_saturado, 0) AS es_destino_saturado
       FROM destino d
       INNER JOIN ubicacion u ON u.id = d.ubicacion_id
       LEFT JOIN destino_metrica dm ON dm.destino_id = d.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY d.fecha_creacion DESC
       LIMIT ?
       OFFSET ?`,
      values
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async update(
    id: string,
    data: UpdateDestinationData
  ): Promise<Destination | null> {
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.name !== undefined) {
      fields.push("nombre = ?");
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push("descripcion = ?");
      values.push(data.description);
    }

    if (data.categoryId !== undefined) {
      fields.push("categoria_id = ?");
      values.push(data.categoryId);
    }

    if (data.locationId !== undefined) {
      fields.push("ubicacion_id = ?");
      values.push(data.locationId);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.execute(
      `UPDATE destino
       SET ${fields.join(", ")}
       WHERE id = ?
       AND activo = 1`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        `UPDATE destino
         SET activo = 0
         WHERE id = ?
         AND activo = 1`,
        [id]
      );

    return result.affectedRows > 0;
  }

  async findCategoryIdByName(name: string): Promise<string | null> {
    const [rows] = await this.databasePool.execute<CatalogRow[]>(
      `SELECT id
       FROM categoria
       WHERE nombre = ?
       LIMIT 1`,
      [name]
    );

    return rows[0]?.id ?? null;
  }

  async locationExists(id: string): Promise<boolean> {
    const [rows] = await this.databasePool.execute<ExistsRow[]>(
      `SELECT COUNT(*) AS total
       FROM ubicacion
       WHERE id = ?`,
      [id]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  private mapToDomain(row: DestinationRow): Destination {
    return {
      id: row.id,
      name: row.nombre,
      description: row.descripcion,
      categoryId: row.categoria_id,
      locationId: row.ubicacion_id,
      active: Boolean(row.activo),
      createdAt: row.fecha_creacion,
      averageRating: Number(row.calificacion_promedio),
      totalReviews: row.total_resenas,
      isSaturated: Boolean(row.es_destino_saturado)
    };
  }
}