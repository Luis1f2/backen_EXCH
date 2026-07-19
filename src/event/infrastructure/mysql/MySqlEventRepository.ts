import type { Pool } from "pg";
import type { Event } from "../../domain/entities/Event.js";
import type {
  CreateEventData,
  EventRepository,
  ListEventsFilter,
  UpdateEventData,
} from "../../domain/repositories/EventRepository.js";

type SqlValue = string | number | boolean | Date | Buffer | null;

interface EventRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  ubicacion_id: string | null;
  categoria_id: string | null;
  categoria_nombre: string | null;
  municipio: string | null;
  activo: boolean;
  fecha_creacion: Date;
}

const SELECT_EVENTO = `
  SELECT
    e.id,
    e.titulo,
    e.descripcion,
    e.imagen_url,
    e.fecha_inicio,
    e.fecha_fin,
    e.ubicacion_id,
    e.categoria_id,
    e.activo,
    e.fecha_creacion,
    c.nombre AS categoria_nombre,
    u.municipio
  FROM evento e
  LEFT JOIN categoria c ON c.id = e.categoria_id
  LEFT JOIN ubicacion u ON u.id = e.ubicacion_id
  WHERE e.activo = true
`;

export class MySqlEventRepository implements EventRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters: ListEventsFilter = {}): Promise<Event[]> {
    let query = SELECT_EVENTO;
    const values: SqlValue[] = [];
    let p = 0;

    if (filters.proximasOnly) {
      query += " AND e.fecha_inicio >= NOW()";
    }

    if (filters.categoriaId) {
      query += ` AND e.categoria_id = $${++p}`;
      values.push(filters.categoriaId);
    }

    query += " ORDER BY e.fecha_inicio ASC";

    const { rows } = await this.pool.query<EventRow>(query, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async categoryCanBeUsedForEvents(categoryId: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ id: string }>(
      `SELECT id
       FROM categoria
       WHERE id = $1
         AND aplica_eventos = true
       LIMIT 1`,
      [categoryId],
    );

    return rows.length > 0;
  }

  async findById(id: string): Promise<Event | null> {
    const query = `${SELECT_EVENTO} AND e.id = $1 LIMIT 1`;
    const { rows } = await this.pool.query<EventRow>(query, [id]);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async create(data: CreateEventData): Promise<Event> {
    await this.pool.query(
      `INSERT INTO evento
        (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion_id, categoria_id, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.id,
        data.titulo,
        data.descripcion ?? null,
        data.imagenUrl ?? null,
        data.fechaInicio,
        data.fechaFin ?? null,
        data.ubicacionId ?? null,
        data.categoriaId ?? null,
        data.creadoPor,
      ],
    );

    const created = await this.findById(data.id);
    if (!created) {
      throw new Error("No se pudo recuperar el evento creado");
    }

    return created;
  }

  async update(id: string, data: UpdateEventData): Promise<Event | null> {
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

    if (data.imagenUrl !== undefined) {
      fields.push(`imagen_url = $${++p}`);
      values.push(data.imagenUrl);
    }

    if (data.fechaInicio !== undefined) {
      fields.push(`fecha_inicio = $${++p}`);
      values.push(data.fechaInicio);
    }

    if (data.fechaFin !== undefined) {
      fields.push(`fecha_fin = $${++p}`);
      values.push(data.fechaFin);
    }

    if (data.ubicacionId !== undefined) {
      fields.push(`ubicacion_id = $${++p}`);
      values.push(data.ubicacionId);
    }

    if (data.categoriaId !== undefined) {
      fields.push(`categoria_id = $${++p}`);
      values.push(data.categoriaId);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.pool.query(
      `UPDATE evento SET ${fields.join(", ")} WHERE id = $${p + 1} AND activo = true`,
      values,
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "UPDATE evento SET activo = false WHERE id = $1 AND activo = true",
      [id],
    );

    return (rowCount ?? 0) > 0;
  }

  private mapToDomain(row: EventRow): Event {
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      imagenUrl: row.imagen_url,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      ubicacionId: row.ubicacion_id,
      categoriaId: row.categoria_id,
      categoriaNombre: row.categoria_nombre,
      municipio: row.municipio,
      activo: Boolean(row.activo),
      fechaCreacion: row.fecha_creacion
    };
  }
}
