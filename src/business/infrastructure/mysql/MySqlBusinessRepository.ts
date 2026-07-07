import { randomUUID } from "node:crypto";

import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type { Business } from "../../domain/entities/Business.js";

import type {
  BusinessRepository,
  CreateBusinessData,
  ListBusinessesFilters,
  UpdateBusinessData
} from "../../domain/repositories/BusinessRepository.js";

interface BusinessRow extends RowDataPacket {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_negocio_id: string;
  ubicacion_id: string;
  precio_desde: string | null;
  esta_verificado: number;
  activo: number;
  fecha_creacion: Date;
  calificacion_promedio: string;
  total_resenas: number;
}

interface CatalogRow extends RowDataPacket {
  id: string;
}

interface ExistsRow extends RowDataPacket {
  total: number;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlBusinessRepository implements BusinessRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateBusinessData): Promise<Business> {
    const connection = await this.databasePool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO negocio_turistico (
          id,
          nombre,
          descripcion,
          tipo_negocio_id,
          ubicacion_id,
          precio_desde
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.name,
          data.description,
          data.businessTypeId,
          data.locationId,
          data.priceFrom
        ]
      );

      await connection.execute(
        `INSERT INTO negocio_metrica (
          negocio_id
        ) VALUES (?)`,
        [data.id]
      );

      await connection.execute(
        `INSERT INTO negocio_administrador (
          id,
          usuario_id,
          negocio_id,
          rol,
          estado_solicitud
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          data.ownerUserId,
          data.id,
          "propietario",
          "pendiente"
        ]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const business = await this.findById(data.id);

    if (!business) {
      throw new Error("No se pudo recuperar el negocio creado");
    }

    return business;
  }

  async findById(id: string): Promise<Business | null> {
    const [rows] = await this.databasePool.execute<BusinessRow[]>(
      `SELECT
        n.id,
        n.nombre,
        n.descripcion,
        n.tipo_negocio_id,
        n.ubicacion_id,
        n.precio_desde,
        n.esta_verificado,
        n.activo,
        n.fecha_creacion,
        COALESCE(nm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(nm.total_resenas, 0) AS total_resenas
       FROM negocio_turistico n
       LEFT JOIN negocio_metrica nm ON nm.negocio_id = n.id
       WHERE n.id = ?
       AND n.activo = 1
       LIMIT 1`,
      [id]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async list(filters: ListBusinessesFilters): Promise<Business[]> {
    const conditions: string[] = ["n.activo = 1"];
    const values: SqlValue[] = [];

    if (filters.businessTypeId) {
      conditions.push("n.tipo_negocio_id = ?");
      values.push(filters.businessTypeId);
    }

    if (filters.locationId) {
      conditions.push("n.ubicacion_id = ?");
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

    if (filters.isVerified !== undefined) {
      conditions.push("n.esta_verificado = ?");
      values.push(filters.isVerified ? 1 : 0);
    }

    values.push(filters.limit);
    values.push(filters.offset);

    const [rows] = await this.databasePool.execute<BusinessRow[]>(
      `SELECT
        n.id,
        n.nombre,
        n.descripcion,
        n.tipo_negocio_id,
        n.ubicacion_id,
        n.precio_desde,
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
       LIMIT ?
       OFFSET ?`,
      values
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async listByAdministratorId(userId: string): Promise<Business[]> {
    const [rows] = await this.databasePool.execute<BusinessRow[]>(
      `SELECT
        n.id,
        n.nombre,
        n.descripcion,
        n.tipo_negocio_id,
        n.ubicacion_id,
        n.precio_desde,
        n.esta_verificado,
        n.activo,
        n.fecha_creacion,
        COALESCE(nm.calificacion_promedio, 0.00) AS calificacion_promedio,
        COALESCE(nm.total_resenas, 0) AS total_resenas
       FROM negocio_turistico n
       INNER JOIN negocio_administrador na
        ON na.negocio_id = n.id
       LEFT JOIN negocio_metrica nm ON nm.negocio_id = n.id
       WHERE na.usuario_id = ?
       AND na.activo = 1
       AND n.activo = 1
       ORDER BY n.fecha_creacion DESC`,
      [userId]
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async update(
    id: string,
    data: UpdateBusinessData
  ): Promise<Business | null> {
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

    if (data.businessTypeId !== undefined) {
      fields.push("tipo_negocio_id = ?");
      values.push(data.businessTypeId);
    }

    if (data.locationId !== undefined) {
      fields.push("ubicacion_id = ?");
      values.push(data.locationId);
    }

    if (data.priceFrom !== undefined) {
      fields.push("precio_desde = ?");
      values.push(data.priceFrom);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.execute(
      `UPDATE negocio_turistico
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
        `UPDATE negocio_turistico
         SET activo = 0
         WHERE id = ?
         AND activo = 1`,
        [id]
      );

    return result.affectedRows > 0;
  }

  async findBusinessTypeIdByName(name: string): Promise<string | null> {
    const [rows] = await this.databasePool.execute<CatalogRow[]>(
      `SELECT id
       FROM tipo_negocio
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

async isUserBusinessOwner(
  userId: string,
  businessId: string
): Promise<boolean> {
  const [rows] = await this.databasePool.execute<ExistsRow[]>(
    `SELECT COUNT(*) AS total
     FROM negocio_administrador na
     INNER JOIN negocio_turistico n
       ON n.id = na.negocio_id
     WHERE na.usuario_id = ?
       AND na.negocio_id = ?
       AND na.rol = 'propietario'
       AND na.activo = 1
       AND n.activo = 1`,
    [userId, businessId]
  );

  return Number(rows[0]?.total ?? 0) > 0;
}

async isUserBusinessAdministrator(
  userId: string,
  businessId: string
): Promise<boolean> {
  const [rows] = await this.databasePool.execute<ExistsRow[]>(
    `SELECT COUNT(*) AS total
     FROM negocio_administrador na
     INNER JOIN negocio_turistico n
       ON n.id = na.negocio_id
     WHERE na.usuario_id = ?
       AND na.negocio_id = ?
       AND na.activo = 1
       AND na.estado_solicitud = 'aprobada'
       AND n.activo = 1
       AND n.esta_verificado = 1`,
    [userId, businessId]
  );

  return Number(rows[0]?.total ?? 0) > 0;
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
      isVerified: Boolean(row.esta_verificado),
      active: Boolean(row.activo),
      createdAt: row.fecha_creacion,
      averageRating: Number(row.calificacion_promedio),
      totalReviews: row.total_resenas
    };
  }
}