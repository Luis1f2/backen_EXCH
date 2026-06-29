import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type {
  Review,
  ReviewTargetType
} from "../../domain/entities/Review.js";

import type {
  CreateReviewData,
  ListReviewsFilters,
  ReviewRepository,
  UpdateReviewData
} from "../../domain/repositories/ReviewRepository.js";

interface ReviewRow extends RowDataPacket {
  id: string;
  usuario_id: string;
  target_type: ReviewTargetType;
  target_id: string;
  calificacion: number;
  comentario: string | null;
  fecha: Date;
}

interface ExistsRow extends RowDataPacket {
  total: number;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

interface ReviewTableConfig {
  table: "resena_destino" | "resena_negocio" | "resena_ubicacion";
  targetColumn: "destino_id" | "negocio_id" | "ubicacion_id";
}

export class MySqlReviewRepository implements ReviewRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateReviewData): Promise<Review> {
    const config = this.getReviewTableConfig(data.targetType);

    await this.databasePool.execute(
      `INSERT INTO ${config.table} (
        id,
        usuario_id,
        ${config.targetColumn},
        calificacion,
        comentario
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        data.id,
        data.userId,
        data.targetId,
        data.rating,
        data.comment
      ]
    );

    await this.refreshMetrics(data.targetType, data.targetId);

    const review = await this.findById(data.id);

    if (!review) {
      throw new Error("No se pudo recuperar la reseña creada");
    }

    return review;
  }

  async findById(id: string): Promise<Review | null> {
    const [rows] = await this.databasePool.execute<ReviewRow[]>(
      `SELECT
        id,
        usuario_id,
        'destination' AS target_type,
        destino_id AS target_id,
        calificacion,
        comentario,
        fecha
       FROM resena_destino
       WHERE id = ?

       UNION ALL

       SELECT
        id,
        usuario_id,
        'business' AS target_type,
        negocio_id AS target_id,
        calificacion,
        comentario,
        fecha
       FROM resena_negocio
       WHERE id = ?

       UNION ALL

       SELECT
        id,
        usuario_id,
        'location' AS target_type,
        ubicacion_id AS target_id,
        calificacion,
        comentario,
        fecha
       FROM resena_ubicacion
       WHERE id = ?

       LIMIT 1`,
      [id, id, id]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async findByUserAndTarget(
    userId: string,
    targetType: ReviewTargetType,
    targetId: string
  ): Promise<Review | null> {
    const config = this.getReviewTableConfig(targetType);

    const [rows] = await this.databasePool.execute<ReviewRow[]>(
      `SELECT
        id,
        usuario_id,
        ? AS target_type,
        ${config.targetColumn} AS target_id,
        calificacion,
        comentario,
        fecha
       FROM ${config.table}
       WHERE usuario_id = ?
       AND ${config.targetColumn} = ?
       LIMIT 1`,
      [targetType, userId, targetId]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async list(filters: ListReviewsFilters): Promise<Review[]> {
    const config = this.getReviewTableConfig(filters.targetType);

    const [rows] = await this.databasePool.execute<ReviewRow[]>(
      `SELECT
        id,
        usuario_id,
        ? AS target_type,
        ${config.targetColumn} AS target_id,
        calificacion,
        comentario,
        fecha
       FROM ${config.table}
       WHERE ${config.targetColumn} = ?
       ORDER BY fecha DESC`,
      [filters.targetType, filters.targetId]
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async update(
    id: string,
    data: UpdateReviewData
  ): Promise<Review | null> {
    const currentReview = await this.findById(id);

    if (!currentReview) {
      return null;
    }

    const config = this.getReviewTableConfig(currentReview.targetType);
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.rating !== undefined) {
      fields.push("calificacion = ?");
      values.push(data.rating);
    }

    if (data.comment !== undefined) {
      fields.push("comentario = ?");
      values.push(data.comment);
    }

    if (fields.length === 0) {
      return currentReview;
    }

    values.push(id);

    await this.databasePool.execute(
      `UPDATE ${config.table}
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values
    );

    await this.refreshMetrics(
      currentReview.targetType,
      currentReview.targetId
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const currentReview = await this.findById(id);

    if (!currentReview) {
      return false;
    }

    const config = this.getReviewTableConfig(currentReview.targetType);

    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        `DELETE FROM ${config.table}
         WHERE id = ?`,
        [id]
      );

    if (result.affectedRows > 0) {
      await this.refreshMetrics(
        currentReview.targetType,
        currentReview.targetId
      );
    }

    return result.affectedRows > 0;
  }

  async targetExists(
    targetType: ReviewTargetType,
    targetId: string
  ): Promise<boolean> {
    const { table, activeColumn } = this.getTargetTableConfig(targetType);

    const activeCondition =
      activeColumn ? `AND ${activeColumn} = 1` : "";

    const [rows] = await this.databasePool.execute<ExistsRow[]>(
      `SELECT COUNT(*) AS total
       FROM ${table}
       WHERE id = ?
       ${activeCondition}`,
      [targetId]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  private getReviewTableConfig(
    targetType: ReviewTargetType
  ): ReviewTableConfig {
    if (targetType === "destination") {
      return {
        table: "resena_destino",
        targetColumn: "destino_id"
      };
    }

    if (targetType === "business") {
      return {
        table: "resena_negocio",
        targetColumn: "negocio_id"
      };
    }

    return {
      table: "resena_ubicacion",
      targetColumn: "ubicacion_id"
    };
  }

  private getTargetTableConfig(targetType: ReviewTargetType): {
    table: "destino" | "negocio_turistico" | "ubicacion";
    activeColumn: "activo" | null;
  } {
    if (targetType === "destination") {
      return {
        table: "destino",
        activeColumn: "activo"
      };
    }

    if (targetType === "business") {
      return {
        table: "negocio_turistico",
        activeColumn: "activo"
      };
    }

    return {
      table: "ubicacion",
      activeColumn: null
    };
  }

  private async refreshMetrics(
    targetType: ReviewTargetType,
    targetId: string
  ): Promise<void> {
    if (targetType === "destination") {
      await this.databasePool.execute(
        `INSERT INTO destino_metrica (
          destino_id,
          calificacion_promedio,
          total_resenas
        )
        SELECT
          ?,
          COALESCE(AVG(calificacion), 0.00),
          COUNT(*)
        FROM resena_destino
        WHERE destino_id = ?
        ON DUPLICATE KEY UPDATE
          calificacion_promedio = VALUES(calificacion_promedio),
          total_resenas = VALUES(total_resenas),
          fecha_actualizacion = CURRENT_TIMESTAMP`,
        [targetId, targetId]
      );

      return;
    }

    if (targetType === "business") {
      await this.databasePool.execute(
        `INSERT INTO negocio_metrica (
          negocio_id,
          calificacion_promedio,
          total_resenas
        )
        SELECT
          ?,
          COALESCE(AVG(calificacion), 0.00),
          COUNT(*)
        FROM resena_negocio
        WHERE negocio_id = ?
        ON DUPLICATE KEY UPDATE
          calificacion_promedio = VALUES(calificacion_promedio),
          total_resenas = VALUES(total_resenas),
          fecha_actualizacion = CURRENT_TIMESTAMP`,
        [targetId, targetId]
      );
    }
  }

  private mapToDomain(row: ReviewRow): Review {
    return {
      id: row.id,
      userId: row.usuario_id,
      targetType: row.target_type,
      targetId: row.target_id,
      rating: row.calificacion,
      comment: row.comentario,
      createdAt: row.fecha
    };
  }
}