import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Category } from "../../domain/entities/Category.js";
import type {
  CategoryRepository,
  CategoryScope,
  CreateCategoryData,
  UpdateCategoryData,
} from "../../domain/repositories/CategoryRepository.js";

type SqlValue = string | number | boolean | Date | Buffer | null;

interface CategoryRow extends RowDataPacket {
  id: string;
  nombre: string;
  icono: string | null;
  aplica_eventos: number;
  aplica_destinos: number;
  total_eventos_activos: number | string;
}

const SELECT_CATEGORY = `
  SELECT
    c.id,
    c.nombre,
    c.icono,
    c.aplica_eventos,
    c.aplica_destinos,
    COUNT(e.id) AS total_eventos_activos
  FROM categoria c
  LEFT JOIN evento e
    ON e.categoria_id = c.id
   AND e.activo = 1
`;

export class MySqlCategoryRepository implements CategoryRepository {
  constructor(private readonly pool: Pool) {}

  async list(scope: CategoryScope = "eventos"): Promise<Category[]> {
    let query = SELECT_CATEGORY;

    if (scope === "eventos") {
      query += " WHERE c.aplica_eventos = 1";
    } else if (scope === "destinos") {
      query += " WHERE c.aplica_destinos = 1";
    }

    query += `
      GROUP BY
        c.id,
        c.nombre,
        c.icono,
        c.aplica_eventos,
        c.aplica_destinos
      ORDER BY c.nombre ASC
    `;

    const [rows] = await this.pool.execute<CategoryRow[]>(query);
    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<Category | null> {
    const query = `${SELECT_CATEGORY}
      WHERE c.id = ?
      GROUP BY
        c.id,
        c.nombre,
        c.icono,
        c.aplica_eventos,
        c.aplica_destinos
      LIMIT 1
    `;

    const [rows] = await this.pool.execute<CategoryRow[]>(query, [id]);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findByName(nombre: string): Promise<Category | null> {
    const query = `${SELECT_CATEGORY}
      WHERE LOWER(TRIM(c.nombre)) = LOWER(TRIM(?))
      GROUP BY
        c.id,
        c.nombre,
        c.icono,
        c.aplica_eventos,
        c.aplica_destinos
      LIMIT 1
    `;

    const [rows] = await this.pool.execute<CategoryRow[]>(query, [nombre]);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    await this.pool.execute(
      `INSERT INTO categoria
        (id, nombre, icono, aplica_eventos, aplica_destinos)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.id,
        data.nombre,
        data.icono ?? null,
        data.aplicaAEventos,
        data.aplicaADestinos,
      ],
    );

    const created = await this.findById(data.id);
    if (!created) {
      throw new Error("No se pudo recuperar la categoría creada");
    }

    return created;
  }

  async update(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category | null> {
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.nombre !== undefined) {
      fields.push("nombre = ?");
      values.push(data.nombre);
    }

    if (data.icono !== undefined) {
      fields.push("icono = ?");
      values.push(data.icono);
    }

    if (data.aplicaAEventos !== undefined) {
      fields.push("aplica_eventos = ?");
      values.push(data.aplicaAEventos);
    }

    if (data.aplicaADestinos !== undefined) {
      fields.push("aplica_destinos = ?");
      values.push(data.aplicaADestinos);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.pool.execute(
      `UPDATE categoria SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  private mapToDomain(row: CategoryRow): Category {
    return {
      id: row.id,
      nombre: row.nombre,
      icono: row.icono,
      aplicaAEventos: Boolean(row.aplica_eventos),
      aplicaADestinos: Boolean(row.aplica_destinos),
      totalEventosActivos: Number(row.total_eventos_activos),
    };
  }
}
