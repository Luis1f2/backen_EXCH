import type {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import type { Event } from "../../domain/entities/Event.js";
import type {
  CreateEventData,
  EventRepository,
  ListEventsFilter,
  UpdateEventData,
} from "../../domain/repositories/EventRepository.js";

type SqlValue = string | number | boolean | Date | Buffer | null;

interface EventRow extends RowDataPacket {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  ubicacion_id: string | null;
  categoria_id: string | null;
  categoria_nombre: string | null;
  municipio: string | null;
  activo: number;
  fecha_creacion: Date;
}

const SELECT_EVENTO = `
  SELECT
    e.id,
    e.titulo,
    e.descripcion,
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
  WHERE e.activo = 1
`;

export class MySqlEventRepository implements EventRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters: ListEventsFilter = {}): Promise<Event[]> {
    let query = SELECT_EVENTO;
    const values: SqlValue[] = [];

    if (filters.proximasOnly) {
      query += " AND e.fecha_inicio >= NOW()";
    }

    if (filters.categoriaId) {
      query += " AND e.categoria_id = ?";
      values.push(filters.categoriaId);
    }

    query += " ORDER BY e.fecha_inicio ASC";

    const [rows] = await this.pool.execute<EventRow[]>(query, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async categoryCanBeUsedForEvents(categoryId: string): Promise<boolean> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT id
       FROM categoria
       WHERE id = ?
         AND aplica_eventos = 1
       LIMIT 1`,
      [categoryId],
    );

    return rows.length > 0;
  }

  async findById(id: string): Promise<Event | null> {
    const query = `${SELECT_EVENTO} AND e.id = ? LIMIT 1`;
    const [rows] = await this.pool.execute<EventRow[]>(query, [id]);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async create(data: CreateEventData): Promise<Event> {
    await this.pool.execute(
      `INSERT INTO evento
        (id, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion_id, categoria_id, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.titulo,
        data.descripcion ?? null,
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

    if (data.fechaInicio !== undefined) {
      fields.push("fecha_inicio = ?");
      values.push(data.fechaInicio);
    }

    if (data.fechaFin !== undefined) {
      fields.push("fecha_fin = ?");
      values.push(data.fechaFin);
    }

    if (data.ubicacionId !== undefined) {
      fields.push("ubicacion_id = ?");
      values.push(data.ubicacionId);
    }

    if (data.categoriaId !== undefined) {
      fields.push("categoria_id = ?");
      values.push(data.categoriaId);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.pool.execute(
      `UPDATE evento SET ${fields.join(", ")} WHERE id = ? AND activo = 1`,
      values,
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      "UPDATE evento SET activo = 0 WHERE id = ? AND activo = 1",
      [id],
    );

    return result.affectedRows > 0;
  }

  private mapToDomain(row: EventRow): Event {
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      ubicacionId: row.ubicacion_id,
      categoriaId: row.categoria_id,
      categoriaNombre: row.categoria_nombre,
      municipio: row.municipio,
      activo: Boolean(row.activo),
      fechaCreacion: row.fecha_creacion,
    };
  }
}
