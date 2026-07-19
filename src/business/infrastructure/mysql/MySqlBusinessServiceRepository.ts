import type { Pool } from "pg";

import type { BusinessService } from "../../domain/entities/BusinessServices.js";

import type {
  BusinessServiceRepository,
  CreateBusinessServiceData,
  UpdateBusinessServiceData
} from "../../domain/repositories/BusinessServicesRepositories.js";

interface BusinessServiceRow {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  precio_adicional: string | null;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

type SqlValue =
  | string
  | number
  | Date
  | Buffer
  | null;

export class MySqlBusinessServiceRepository
  implements BusinessServiceRepository
{
  constructor(
    private readonly databasePool: Pool
  ) {}

  async listByBusinessId(
    businessId: string
  ): Promise<BusinessService[]> {
    const { rows } =
      await this.databasePool.query<BusinessServiceRow>(
        `SELECT
           ns.id,
           ns.negocio_id,
           ns.nombre,
           ns.descripcion,
           ns.precio_adicional,
           ns.activo,
           ns.fecha_creacion,
           ns.fecha_actualizacion
         FROM negocio_servicio ns
         INNER JOIN negocio_turistico n ON n.id = ns.negocio_id
         WHERE ns.negocio_id = $1
           AND ns.activo = true
           AND n.activo = true
           AND n.esta_verificado = true
         ORDER BY ns.nombre ASC`,
        [businessId]
      );

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(
    serviceId: string
  ): Promise<BusinessService | null> {
    const { rows } =
      await this.databasePool.query<BusinessServiceRow>(
        `SELECT
           id,
           negocio_id,
           nombre,
           descripcion,
           precio_adicional,
           activo,
           fecha_creacion,
           fecha_actualizacion
         FROM negocio_servicio
         WHERE id = $1
           AND activo = true
         LIMIT 1`,
        [serviceId]
      );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async create(
    data: CreateBusinessServiceData
  ): Promise<BusinessService> {
    await this.databasePool.query(
      `INSERT INTO negocio_servicio (
         id,
         negocio_id,
         nombre,
         descripcion,
         precio_adicional
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.id,
        data.businessId,
        data.name,
        data.description,
        data.additionalPrice
      ]
    );

    const created = await this.findById(data.id);

    if (!created) {
      throw new Error("No se pudo recuperar el servicio creado");
    }

    return created;
  }

  async update(
    serviceId: string,
    data: UpdateBusinessServiceData
  ): Promise<BusinessService | null> {
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

    if (data.additionalPrice !== undefined) {
      fields.push(`precio_adicional = $${++p}`);
      values.push(data.additionalPrice);
    }

    if (fields.length === 0) {
      return this.findById(serviceId);
    }

    values.push(serviceId);

    await this.databasePool.query(
      `UPDATE negocio_servicio
       SET ${fields.join(", ")}
       WHERE id = $${p + 1}
         AND activo = true`,
      values
    );

    return this.findById(serviceId);
  }

  async delete(
    serviceId: string
  ): Promise<boolean> {
    const { rowCount } =
      await this.databasePool.query(
        `UPDATE negocio_servicio
         SET activo = false
         WHERE id = $1
           AND activo = true`,
        [serviceId]
      );

    return (rowCount ?? 0) > 0;
  }

  private mapToDomain(
    row: BusinessServiceRow
  ): BusinessService {
    return {
      id: row.id,
      businessId: row.negocio_id,
      name: row.nombre,
      description: row.descripcion,
      additionalPrice:
        row.precio_adicional === null
          ? null
          : Number(row.precio_adicional),
      active: Boolean(row.activo),
      createdAt: row.fecha_creacion,
      updatedAt: row.fecha_actualizacion
    };
  }
}
