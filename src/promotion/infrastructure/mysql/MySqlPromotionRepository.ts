import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type { Promotion } from "../../domain/entities/Promotion.js";

import type {
  CreatePromotionData,
  PromotionRepository,
  UpdatePromotionData
} from "../../domain/repositories/PromotionRepository.js";

type SqlValue =
  | string
  | number
  | boolean
  | Date
  | Buffer
  | null;

interface PromoRow extends RowDataPacket {
  id: string;
  titulo: string;
  descripcion: string | null;
  precio: number | null;
  negocio_id: string;
  negocio_nombre: string | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  activo: number;
  fecha_creacion: Date;
}

const SELECT_PROMO = `
  SELECT
    p.id,
    p.titulo,
    p.descripcion,
    p.precio,
    p.negocio_id,
    n.nombre AS negocio_nombre,
    p.fecha_inicio,
    p.fecha_fin,
    p.activo,
    p.fecha_creacion
  FROM promocion p
  INNER JOIN negocio_turistico n
    ON n.id = p.negocio_id
  WHERE p.activo = 1
    AND n.activo = 1
    AND n.esta_verificado = 1
`;

export class MySqlPromotionRepository
  implements PromotionRepository
{
  constructor(
    private readonly pool: Pool
  ) {}

  async listByBusiness(
    negocioId: string
  ): Promise<Promotion[]> {
    const [rows] =
      await this.pool.execute<PromoRow[]>(
        `${SELECT_PROMO}
         AND p.negocio_id = ?
         ORDER BY p.fecha_inicio DESC`,
        [negocioId]
      );

    return rows.map((row) =>
      this.mapToDomain(row)
    );
  }

  async listActive(): Promise<Promotion[]> {
    const [rows] =
      await this.pool.execute<PromoRow[]>(
        `${SELECT_PROMO}
         AND p.fecha_inicio <= NOW()
         AND (
           p.fecha_fin IS NULL
           OR p.fecha_fin >= NOW()
         )
         ORDER BY p.fecha_inicio DESC`
      );

    return rows.map((row) =>
      this.mapToDomain(row)
    );
  }

  async findById(
    id: string
  ): Promise<Promotion | null> {
    const [rows] =
      await this.pool.execute<PromoRow[]>(
        `${SELECT_PROMO}
         AND p.id = ?
         LIMIT 1`,
        [id]
      );

    const row = rows[0];

    return row
      ? this.mapToDomain(row)
      : null;
  }

  async create(
    data: CreatePromotionData
  ): Promise<Promotion> {
    await this.pool.execute(
      `INSERT INTO promocion (
         id,
         titulo,
         descripcion,
         precio,
         negocio_id,
         fecha_inicio,
         fecha_fin,
         creado_por
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.titulo,
        data.descripcion ?? null,
        data.precio ?? null,
        data.negocioId,
        data.fechaInicio,
        data.fechaFin ?? null,
        data.creadoPor
      ]
    );

    const created =
      await this.findById(data.id);

    if (!created) {
      throw new Error(
        "No se pudo recuperar la promoción creada"
      );
    }

    return created;
  }

  async update(
    id: string,
    data: UpdatePromotionData
  ): Promise<Promotion | null> {
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.titulo !== undefined) {
      fields.push("titulo = ?");
      values.push(data.titulo);
    }

    if (data.descripcion !== undefined) {
      fields.push("descripcion = ?");
      values.push(data.descripcion);
    }

    if (data.precio !== undefined) {
      fields.push("precio = ?");
      values.push(data.precio);
    }

    if (data.fechaInicio !== undefined) {
      fields.push("fecha_inicio = ?");
      values.push(data.fechaInicio);
    }

    if (data.fechaFin !== undefined) {
      fields.push("fecha_fin = ?");
      values.push(data.fechaFin);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.pool.execute<ResultSetHeader>(
      `UPDATE promocion
       SET ${fields.join(", ")}
       WHERE id = ?
         AND activo = 1`,
      values
    );

    return this.findById(id);
  }

  async delete(
    id: string
  ): Promise<boolean> {
    const [result] =
      await this.pool.execute<ResultSetHeader>(
        `UPDATE promocion
         SET activo = 0
         WHERE id = ?
           AND activo = 1`,
        [id]
      );

    return result.affectedRows > 0;
  }

  async isBusinessOwner(
    negocioId: string,
    userId: string
  ): Promise<boolean> {
    const [rows] =
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
        [negocioId, userId]
      );

    return rows.length > 0;
  }

  async isOwner(
    promotionId: string,
    userId: string
  ): Promise<boolean> {
    const [rows] =
      await this.pool.execute<RowDataPacket[]>(
        `SELECT p.id
         FROM promocion p
         INNER JOIN negocio_turistico n
           ON n.id = p.negocio_id
         INNER JOIN negocio_administrador na
           ON na.negocio_id = p.negocio_id
         WHERE p.id = ?
           AND p.activo = 1
           AND na.usuario_id = ?
           AND na.activo = 1
           AND na.estado_solicitud = 'aprobada'
           AND n.activo = 1
           AND n.esta_verificado = 1
         LIMIT 1`,
        [promotionId, userId]
      );

    return rows.length > 0;
  }

  private mapToDomain(
    row: PromoRow
  ): Promotion {
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      precio:
        row.precio === null
          ? null
          : Number(row.precio),
      negocioId: row.negocio_id,
      negocioNombre: row.negocio_nombre,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      activo: Boolean(row.activo),
      fechaCreacion: row.fecha_creacion
    };
  }
}