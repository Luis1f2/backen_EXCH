import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type { BusinessService } from "../../domain/entities/BusinessServices.js";

import type {
  BusinessServiceRepository,
  CreateBusinessServiceData,
  UpdateBusinessServiceData
} from "../../domain/repositories/BusinessServicesRepositories.js";

interface BusinessServiceRow extends RowDataPacket {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  precio_adicional: string | null;
  activo: number;
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
    const [rows] =
      await this.databasePool.execute<BusinessServiceRow[]>(
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
         INNER JOIN negocio_turistico n
           ON n.id = ns.negocio_id
         WHERE ns.negocio_id = ?
           AND ns.activo = 1
           AND n.activo = 1
           AND n.esta_verificado = 1
         ORDER BY ns.nombre ASC`,
        [businessId]
      );

    return rows.map((row) =>
      this.mapToDomain(row)
    );
  }

  async findById(
    serviceId: string
  ): Promise<BusinessService | null> {
    const [rows] =
      await this.databasePool.execute<BusinessServiceRow[]>(
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
         WHERE id = ?
           AND activo = 1
         LIMIT 1`,
        [serviceId]
      );

    const row = rows[0];

    return row
      ? this.mapToDomain(row)
      : null;
  }

  async create(
    data: CreateBusinessServiceData
  ): Promise<BusinessService> {
    await this.databasePool.execute(
      `INSERT INTO negocio_servicio (
         id,
         negocio_id,
         nombre,
         descripcion,
         precio_adicional
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.id,
        data.businessId,
        data.name,
        data.description,
        data.additionalPrice
      ]
    );

    const created =
      await this.findById(data.id);

    if (!created) {
      throw new Error(
        "No se pudo recuperar el servicio creado"
      );
    }

    return created;
  }

  async update(
    serviceId: string,
    data: UpdateBusinessServiceData
  ): Promise<BusinessService | null> {
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

    if (data.additionalPrice !== undefined) {
      fields.push("precio_adicional = ?");
      values.push(data.additionalPrice);
    }

    if (fields.length === 0) {
      return this.findById(serviceId);
    }

    values.push(serviceId);

    await this.databasePool.execute<ResultSetHeader>(
      `UPDATE negocio_servicio
       SET ${fields.join(", ")}
       WHERE id = ?
         AND activo = 1`,
      values
    );

    return this.findById(serviceId);
  }

  async delete(
    serviceId: string
  ): Promise<boolean> {
    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        `UPDATE negocio_servicio
         SET activo = 0
         WHERE id = ?
           AND activo = 1`,
        [serviceId]
      );

    return result.affectedRows > 0;
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