import type { Pool } from "pg";

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

interface PromoRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio: number | null;
  negocio_id: string;
  negocio_nombre: string | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  activo: boolean;
  fecha_creacion: Date;
}

const SELECT_PROMO = `
  SELECT
    p.id,
    p.titulo,
    p.descripcion,
    p.imagen_url,
    p.precio,
    p.negocio_id,
    n.nombre AS negocio_nombre,
    p.fecha_inicio,
    p.fecha_fin,
    p.activo,
    p.fecha_creacion
  FROM promocion p
  INNER JOIN negocio_turistico n ON n.id = p.negocio_id
  WHERE p.activo = true
    AND n.activo = true
    AND n.esta_verificado = true
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
    const { rows } =
      await this.pool.query<PromoRow>(
        `${SELECT_PROMO}
         AND p.negocio_id = $1
         ORDER BY p.fecha_inicio DESC`,
        [negocioId]
      );

    return rows.map((row) => this.mapToDomain(row));
  }

  async listActive(): Promise<Promotion[]> {
    const { rows } =
      await this.pool.query<PromoRow>(
        `${SELECT_PROMO}
         AND p.fecha_inicio <= NOW()
         AND (
           p.fecha_fin IS NULL
           OR p.fecha_fin >= NOW()
         )
         ORDER BY p.fecha_inicio DESC`
      );

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(
    id: string
  ): Promise<Promotion | null> {
    const { rows } =
      await this.pool.query<PromoRow>(
        `${SELECT_PROMO}
         AND p.id = $1
         LIMIT 1`,
        [id]
      );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async create(
    data: CreatePromotionData
  ): Promise<Promotion> {
    await this.pool.query(
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

    const created = await this.findById(data.id);

    if (!created) {
      throw new Error("No se pudo recuperar la promoción creada");
    }

    return created;
  }

  async update(
    id: string,
    data: UpdatePromotionData
  ): Promise<Promotion | null> {
    let p = 0;
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.titulo !== undefined) {
      fields.push(`titulo = $${++p}`);
      values.push(data.titulo);
    }

    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${++p}`);
      values.push(data.descripcion);
    }

    if (data.precio !== undefined) {
      fields.push(`precio = $${++p}`);
      values.push(data.precio);
    }

    if (data.fechaInicio !== undefined) {
      fields.push(`fecha_inicio = $${++p}`);
      values.push(data.fechaInicio);
    }

    if (data.fechaFin !== undefined) {
      fields.push(`fecha_fin = $${++p}`);
      values.push(data.fechaFin);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.pool.query(
      `UPDATE promocion
       SET ${fields.join(", ")}
       WHERE id = $${p + 1}
         AND activo = true`,
      values
    );

    return this.findById(id);
  }

  async delete(
    id: string
  ): Promise<boolean> {
    const { rowCount } =
      await this.pool.query(
        `UPDATE promocion
         SET activo = false
         WHERE id = $1
           AND activo = true`,
        [id]
      );

    return (rowCount ?? 0) > 0;
  }

  async isBusinessOwner(
    negocioId: string,
    userId: string
  ): Promise<boolean> {
    const { rows } =
      await this.pool.query<{ id: string }>(
        `SELECT na.id
         FROM negocio_administrador na
         INNER JOIN negocio_turistico n ON n.id = na.negocio_id
         WHERE na.negocio_id = $1
           AND na.usuario_id = $2
           AND na.activo = true
           AND na.estado_solicitud = 'aprobada'
           AND n.activo = true
           AND n.esta_verificado = true
         LIMIT 1`,
        [negocioId, userId]
      );

    return rows.length > 0;
  }

  async isOwner(
    promotionId: string,
    userId: string
  ): Promise<boolean> {
    const { rows } =
      await this.pool.query<{ id: string }>(
        `SELECT p.id
         FROM promocion p
         INNER JOIN negocio_turistico n ON n.id = p.negocio_id
         INNER JOIN negocio_administrador na ON na.negocio_id = p.negocio_id
         WHERE p.id = $1
           AND p.activo = true
           AND na.usuario_id = $2
           AND na.activo = true
           AND na.estado_solicitud = 'aprobada'
           AND n.activo = true
           AND n.esta_verificado = true
         LIMIT 1`,
        [promotionId, userId]
      );

    return rows.length > 0;
  }

  private mapToDomain(row: PromoRow): Promotion {
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      imagenUrl: row.imagen_url,
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
