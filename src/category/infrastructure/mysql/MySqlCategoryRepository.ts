import type { Pool } from "pg";

import type { Category } from "../../domain/entities/Category.js";
import type {
  CategoryRepository,
  CategoryScope,
  CreateCategoryData,
  UpdateCategoryData,
} from "../../domain/repositories/CategoryRepository.js";

type SqlValue = string | number | boolean | Date | Buffer | null;

interface CategoryRow {
  id: string;
  nombre: string;
  icono: string | null;
  aplica_eventos: boolean;
  aplica_destinos: boolean;
  total_eventos_activos: string;
  total_destinos_activos: string;
}

interface CategoryInUseRow {
  total: string;
}

const SELECT_CATEGORY = `
  SELECT
    c.id,
    c.nombre,
    c.icono,
    c.aplica_eventos,
    c.aplica_destinos,

    COUNT(DISTINCT CASE
      WHEN e.activo = true THEN e.id
    END) AS total_eventos_activos,

    COUNT(DISTINCT CASE
      WHEN d.activo = true THEN d.id
    END) AS total_destinos_activos

  FROM categoria c

  LEFT JOIN evento e
    ON e.categoria_id = c.id

  LEFT JOIN destino d
    ON d.categoria_id = c.id
`;

export class MySqlCategoryRepository implements CategoryRepository {
  constructor(private readonly pool: Pool) {}

  async list(scope: CategoryScope = "eventos"): Promise<Category[]> {
    let query = SELECT_CATEGORY;
    const conditions: string[] = [];

    if (scope === "eventos") {
      conditions.push("c.aplica_eventos = true");
    }

    if (scope === "destinos") {
      conditions.push("c.aplica_destinos = true");
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
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

    const { rows } = await this.pool.query<CategoryRow>(query);

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<Category | null> {
    const query = `
      ${SELECT_CATEGORY}

      WHERE c.id = $1

      GROUP BY
        c.id,
        c.nombre,
        c.icono,
        c.aplica_eventos,
        c.aplica_destinos

      LIMIT 1
    `;

    const { rows } = await this.pool.query<CategoryRow>(query, [id]);

    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findByName(nombre: string): Promise<Category | null> {
    const query = `
      ${SELECT_CATEGORY}

      WHERE LOWER(TRIM(c.nombre)) = LOWER(TRIM($1))

      GROUP BY
        c.id,
        c.nombre,
        c.icono,
        c.aplica_eventos,
        c.aplica_destinos

      LIMIT 1
    `;

    const { rows } = await this.pool.query<CategoryRow>(query, [nombre]);

    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    await this.pool.query(
      `
        INSERT INTO categoria (
          id,
          nombre,
          icono,
          aplica_eventos,
          aplica_destinos
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
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
    let p = 0;
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.nombre !== undefined) {
      fields.push(`nombre = $${++p}`);
      values.push(data.nombre);
    }

    if (data.icono !== undefined) {
      fields.push(`icono = $${++p}`);
      values.push(data.icono);
    }

    if (data.aplicaAEventos !== undefined) {
      fields.push(`aplica_eventos = $${++p}`);
      values.push(data.aplicaAEventos);
    }

    if (data.aplicaADestinos !== undefined) {
      fields.push(`aplica_destinos = $${++p}`);
      values.push(data.aplicaADestinos);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const { rowCount } = await this.pool.query(
      `
        UPDATE categoria
        SET ${fields.join(", ")}
        WHERE id = $${p + 1}
      `,
      values,
    );

    if ((rowCount ?? 0) === 0) {
      return null;
    }

    return this.findById(id);
  }

  async isInUse(id: string): Promise<boolean> {
    const { rows } = await this.pool.query<CategoryInUseRow>(
      `
        SELECT (
          (SELECT COUNT(*) FROM evento WHERE categoria_id = $1)
          +
          (SELECT COUNT(*) FROM destino WHERE categoria_id = $2)
        ) AS total
      `,
      [id, id],
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `
        DELETE FROM categoria
        WHERE id = $1
      `,
      [id],
    );

    return (rowCount ?? 0) > 0;
  }

  private mapToDomain(row: CategoryRow): Category {
    return {
      id: row.id,
      nombre: row.nombre,
      icono: row.icono,
      aplicaAEventos: Boolean(row.aplica_eventos),
      aplicaADestinos: Boolean(row.aplica_destinos),
      totalEventosActivos: Number(row.total_eventos_activos),
      totalDestinosActivos: Number(row.total_destinos_activos),
    };
  }
}
