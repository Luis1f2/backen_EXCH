import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { Business } from "../../domain/entities/Business.js";

import type {
  BusinessRepository,
  CreateBusinessData,
  ListBusinessesFilters,
  UpdateBusinessData
} from "../../domain/repositories/BusinessRepository.js";

interface BusinessRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_negocio_id: string;
  ubicacion_id: string;
  precio_desde: string | null;
  imagen_url: string | null;
  esta_verificado: boolean;
  activo: boolean;
  fecha_creacion: Date;
  calificacion_promedio: string;
  total_resenas: number;
}

interface CatalogRow {
  id: string;
}

interface ExistsRow {
  total: string;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlBusinessRepository implements BusinessRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateBusinessData): Promise<Business> {
    const client = await this.databasePool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO negocio_turistico (
          id,
          nombre,
          descripcion,
          tipo_negocio_id,
          ubicacion_id,
          precio_desde
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.id,
          data.name,
          data.description,
          data.businessTypeId,
          data.locationId,
          data.priceFrom
        ]
      );

      await client.query(
        `INSERT INTO negocio_metrica (negocio_id) VALUES ($1)`,
        [data.id]
      );

      await client.query(
        `INSERT INTO negocio_administrador (
          id,
          usuario_id,
          negocio_id,
          rol,
          estado_solicitud
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          data.ownerUserId,
          data.id,
          "propietario",
          "pendiente"
        ]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const business = await this.findById(data.id);

    if (!business) {
      throw new Error("No se pudo recuperar el negocio creado");
    }

    return business;
  }

  async findById(id: string): Promise<Business | null> {
    const { rows } = await this.databasePool.query<BusinessRow>(
      `SELECT
        n.id,
        n.nombre,
        n.descripcion,
        n.tipo_negocio_id,
        n.ubicacion_id,
        n.precio_desde,
        n.imagen_url,
        n.esta_verificado,
        n.activo,
        n.fecha_creacion,
        COALESCE(nm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(nm.total_resenas, 0) AS total_resenas
       FROM negocio_turistico n
       LEFT JOIN negocio_metrica nm ON nm.negocio_id = n.id
       WHERE n.id = $1
       AND n.activo = true
       LIMIT 1`,
      [id]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async list(filters: ListBusinessesFilters): Promise<Business[]> {
    let p = 0;
    const conditions: string[] = [
      "n.activo = true",
      "n.esta_verificado = true"
    ];
    const values: SqlValue[] = [];

    if (filters.businessTypeId) {
      conditions.push(`n.tipo_negocio_id = $${++p}`);
      values.push(filters.businessTypeId);
    }

    if (filters.locationId) {
      conditions.push(`n.ubicacion_id = $${++p}`);
      values.push(filters.locationId);
    }

    if (filters.municipality) {
      conditions.push(`u.municipio = $${++p}`);
      values.push(filters.municipality);
    }

    if (filters.state) {
      conditions.push(`u.estado = $${++p}`);
      values.push(filters.state);
    }

    const limit = Number(filters.limit);
    const offset = Number(filters.offset);

    const query = `
      SELECT
        n.id,
        n.nombre,
        n.descripcion,
        n.tipo_negocio_id,
        n.ubicacion_id,
        n.precio_desde,
        n.imagen_url,
        n.esta_verificado,
        n.activo,
        n.fecha_creacion,
        COALESCE(nm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(nm.total_resenas, 0) AS total_resenas
      FROM negocio_turistico n
      INNER JOIN ubicacion u ON u.id = n.ubicacion_id
      LEFT JOIN negocio_metrica nm ON nm.negocio_id = n.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY n.fecha_creacion DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const { rows } = await this.databasePool.query<BusinessRow>(query, values);

    return rows.map((row) => this.mapToDomain(row));
  }

  async listByAdministratorId(userId: string): Promise<Business[]> {
    const { rows } = await this.databasePool.query<BusinessRow>(
      `SELECT
        n.id,
        n.nombre,
        n.descripcion,
        n.tipo_negocio_id,
        n.ubicacion_id,
        n.precio_desde,
        n.imagen_url,
        n.esta_verificado,
        n.activo,
        n.fecha_creacion,
        COALESCE(nm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(nm.total_resenas, 0) AS total_resenas
       FROM negocio_turistico n
       INNER JOIN negocio_administrador na ON na.negocio_id = n.id
       LEFT JOIN negocio_metrica nm ON nm.negocio_id = n.id
       WHERE na.usuario_id = $1
       AND na.activo = true
       AND n.activo = true
       ORDER BY n.fecha_creacion DESC`,
      [userId]
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async update(
    id: string,
    data: UpdateBusinessData
  ): Promise<Business | null> {
    let p = 0;
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.name !== undefined) {
      fields.push(`nombre = $${++p}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push(`descripcion = $${++p}`);
      values.push(data.description);
    }

    if (data.businessTypeId !== undefined) {
      fields.push(`tipo_negocio_id = $${++p}`);
      values.push(data.businessTypeId);
    }

    if (data.locationId !== undefined) {
      fields.push(`ubicacion_id = $${++p}`);
      values.push(data.locationId);
    }

    if (data.priceFrom !== undefined) {
      fields.push(`precio_desde = $${++p}`);
      values.push(data.priceFrom);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.query(
      `UPDATE negocio_turistico
       SET ${fields.join(", ")}
       WHERE id = $${p + 1}
       AND activo = true`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.databasePool.query(
      `UPDATE negocio_turistico
       SET activo = false
       WHERE id = $1
       AND activo = true`,
      [id]
    );

    return (rowCount ?? 0) > 0;
  }

  async findBusinessTypeIdByName(name: string): Promise<string | null> {
    const { rows } = await this.databasePool.query<CatalogRow>(
      `SELECT id
       FROM tipo_negocio
       WHERE nombre = $1
       LIMIT 1`,
      [name]
    );

    return rows[0]?.id ?? null;
  }

  async locationExists(id: string): Promise<boolean> {
    const { rows } = await this.databasePool.query<ExistsRow>(
      `SELECT COUNT(*) AS total
       FROM ubicacion
       WHERE id = $1`,
      [id]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  async isUserBusinessOwner(
    userId: string,
    businessId: string
  ): Promise<boolean> {
    const { rows } = await this.databasePool.query<ExistsRow>(
      `SELECT COUNT(*) AS total
       FROM negocio_administrador na
       INNER JOIN negocio_turistico n ON n.id = na.negocio_id
       WHERE na.usuario_id = $1
         AND na.negocio_id = $2
         AND na.rol = 'propietario'
         AND na.activo = true
         AND n.activo = true`,
      [userId, businessId]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  async isUserBusinessAdministrator(
    userId: string,
    businessId: string
  ): Promise<boolean> {
    const { rows } = await this.databasePool.query<ExistsRow>(
      `SELECT COUNT(*) AS total
       FROM negocio_administrador na
       INNER JOIN negocio_turistico n ON n.id = na.negocio_id
       WHERE na.usuario_id = $1
         AND na.negocio_id = $2
         AND na.activo = true
         AND na.estado_solicitud = 'aprobada'
         AND n.activo = true
         AND n.esta_verificado = true`,
      [userId, businessId]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  async incrementViews(businessId: string): Promise<void> {
    await this.databasePool.query(
      `INSERT INTO negocio_metrica (negocio_id, total_visualizaciones)
       VALUES ($1, 1)
       ON CONFLICT (negocio_id) DO UPDATE SET
         total_visualizaciones = negocio_metrica.total_visualizaciones + 1`,
      [businessId]
    );
  }

  private mapToDomain(row: BusinessRow): Business {
    return {
      id: row.id,
      name: row.nombre,
      description: row.descripcion,
      businessTypeId: row.tipo_negocio_id,
      locationId: row.ubicacion_id,
      priceFrom:
        row.precio_desde === null ? null : Number(row.precio_desde),
      imageUrl: row.imagen_url,
      isVerified: Boolean(row.esta_verificado),
      active: Boolean(row.activo),
      createdAt: row.fecha_creacion,
      averageRating: Number(row.calificacion_promedio),
      totalReviews: row.total_resenas
    };
  }
}
