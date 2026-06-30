import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type {
  RouteDestination,
  TravelRoute
} from "../../domain/entities/TravelRoute.js";

import type {
  CreateRouteData,
  ListRoutesFilters,
  RouteRepository,
  UpdateRouteData
} from "../../domain/repositories/RouteRepository.js";

interface RouteRow extends RowDataPacket {
  id: string;
  usuario_id: string | null;
  nombre: string;
  presupuesto: string | null;
  duracion_dias: number | null;
  fecha_creacion: Date;
  es_personalizada: number;
}

interface RouteDestinationRow extends RowDataPacket {
  destino_id: string;
  orden_visita: number;
  dia_visita: number;
}

interface ExistsRow extends RowDataPacket {
  total: number;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlRouteRepository implements RouteRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateRouteData): Promise<TravelRoute> {
    const connection = await this.databasePool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO ruta (
          id,
          usuario_id,
          nombre,
          presupuesto,
          duracion_dias,
          es_personalizada
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.userId,
          data.name,
          data.budget,
          data.durationDays,
          data.isPersonalized ? 1 : 0
        ]
      );

      for (const destination of data.destinations) {
        await connection.execute(
          `INSERT INTO ruta_destino (
            ruta_id,
            destino_id,
            orden_visita,
            dia_visita
          ) VALUES (?, ?, ?, ?)`,
          [
            data.id,
            destination.destinationId,
            destination.visitOrder,
            destination.visitDay
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const route = await this.findById(data.id);

    if (!route) {
      throw new Error("No se pudo recuperar la ruta creada");
    }

    return route;
  }

  async findById(id: string): Promise<TravelRoute | null> {
    const [rows] = await this.databasePool.execute<RouteRow[]>(
      `SELECT
        id,
        usuario_id,
        nombre,
        presupuesto,
        duracion_dias,
        fecha_creacion,
        es_personalizada
       FROM ruta
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    const destinations = await this.findDestinationsByRouteId(id);

    return this.mapToDomain(row, destinations);
  }

  async list(filters: ListRoutesFilters): Promise<TravelRoute[]> {
    const conditions: string[] = [];
    const values: SqlValue[] = [];

    if (filters.userId !== undefined) {
      conditions.push("usuario_id = ?");
      values.push(filters.userId);
    }

    if (filters.onlyPublic) {
      conditions.push("usuario_id IS NULL");
    }

    values.push(filters.limit);
    values.push(filters.offset);

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await this.databasePool.execute<RouteRow[]>(
      `SELECT
        id,
        usuario_id,
        nombre,
        presupuesto,
        duracion_dias,
        fecha_creacion,
        es_personalizada
       FROM ruta
       ${where}
       ORDER BY fecha_creacion DESC
       LIMIT ?
       OFFSET ?`,
      values
    );

    const routes: TravelRoute[] = [];

    for (const row of rows) {
      const destinations = await this.findDestinationsByRouteId(row.id);
      routes.push(this.mapToDomain(row, destinations));
    }

    return routes;
  }

  async update(
    id: string,
    data: UpdateRouteData
  ): Promise<TravelRoute | null> {
    const connection = await this.databasePool.getConnection();

    try {
      await connection.beginTransaction();

      const fields: string[] = [];
      const values: SqlValue[] = [];

      if (data.name !== undefined) {
        fields.push("nombre = ?");
        values.push(data.name);
      }

      if (data.budget !== undefined) {
        fields.push("presupuesto = ?");
        values.push(data.budget);
      }

      if (data.durationDays !== undefined) {
        fields.push("duracion_dias = ?");
        values.push(data.durationDays);
      }

      if (fields.length > 0) {
        values.push(id);

        await connection.execute(
          `UPDATE ruta
           SET ${fields.join(", ")}
           WHERE id = ?`,
          values
        );
      }

      if (data.destinations !== undefined) {
        await connection.execute(
          `DELETE FROM ruta_destino
           WHERE ruta_id = ?`,
          [id]
        );

        for (const destination of data.destinations) {
          await connection.execute(
            `INSERT INTO ruta_destino (
              ruta_id,
              destino_id,
              orden_visita,
              dia_visita
            ) VALUES (?, ?, ?, ?)`,
            [
              id,
              destination.destinationId,
              destination.visitOrder,
              destination.visitDay
            ]
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        `DELETE FROM ruta
         WHERE id = ?`,
        [id]
      );

    return result.affectedRows > 0;
  }

  async destinationExists(destinationId: string): Promise<boolean> {
    const [rows] = await this.databasePool.execute<ExistsRow[]>(
      `SELECT COUNT(*) AS total
       FROM destino
       WHERE id = ?
       AND activo = 1`,
      [destinationId]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  private async findDestinationsByRouteId(
    routeId: string
  ): Promise<RouteDestination[]> {
    const [rows] =
      await this.databasePool.execute<RouteDestinationRow[]>(
        `SELECT
          destino_id,
          orden_visita,
          dia_visita
         FROM ruta_destino
         WHERE ruta_id = ?
         ORDER BY orden_visita ASC`,
        [routeId]
      );

    return rows.map((row) => ({
      destinationId: row.destino_id,
      visitOrder: row.orden_visita,
      visitDay: row.dia_visita
    }));
  }

  private mapToDomain(
    row: RouteRow,
    destinations: RouteDestination[]
  ): TravelRoute {
    return {
      id: row.id,
      userId: row.usuario_id,
      name: row.nombre,
      budget:
        row.presupuesto === null ? null : Number(row.presupuesto),
      durationDays: row.duracion_dias,
      createdAt: row.fecha_creacion,
      isPersonalized: Boolean(row.es_personalizada),
      destinations
    };
  }
}