import type { Pool } from "pg";

import type {
  User,
  UserType,
} from "../../domain/entities/User.js";

import type {
  CreateUserData,
  UpdateUserData,
  UserRepository
} from "../../domain/repositories/UserRepository.js";

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  tipo_usuario_id: string;
  tipo_usuario_nombre: UserType;
  telefono: string | null;
  imagen_perfil_url: string | null;
  fecha_registro: Date;
  es_premium: boolean;
  activo: boolean;
}

interface UserTypeRow {
  id: string;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlUserRepository implements UserRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateUserData): Promise<User> {
    await this.databasePool.query(
      `INSERT INTO usuario (
        id,
        nombre,
        email,
        password_hash,
        tipo_usuario_id,
        telefono
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.id,
        data.name,
        data.email,
        data.passwordHash,
        data.userTypeId,
        data.phone
      ]
    );

    const user = await this.findById(data.id);

    if (!user) {
      throw new Error("No se pudo recuperar el usuario creado");
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne("u.id = $1", [id], { soloActivos: true });
  }

  async findByEmail(email: string,): Promise<User | null> {const normalizedEmail =email.trim().toLowerCase();

  return this.findOne(
    "LOWER(u.email) = $1",
    [
      normalizedEmail,
    ],
    {
      soloActivos: false,
    },
  );
}

  async findUserTypeIdByName(name: string): Promise<string | null> {
    const { rows } = await this.databasePool.query<UserTypeRow>(
      `SELECT id FROM tipo_usuario WHERE nombre = $1 LIMIT 1`,
      [name]
    );

    return rows[0]?.id ?? null;
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    let p = 0;
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.name !== undefined) {
      fields.push(`nombre = $${++p}`);
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push(`email = $${++p}`);
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push(`telefono = $${++p}`);
      values.push(data.phone);
    }

    if (data.passwordHash !== undefined) {
      fields.push(`password_hash = $${++p}`);
      values.push(data.passwordHash);
    }

    if (data.imgUrl !== undefined) {
      fields.push(`imagen_perfil_url = $${++p}`);
      values.push(data.imgUrl);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.query(
      `UPDATE usuario SET ${fields.join(", ")} WHERE id = $${p + 1} AND activo = true`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.databasePool.query(
      `UPDATE usuario SET activo = false WHERE id = $1 AND activo = true`,
      [id]
    );

    return (rowCount ?? 0) > 0;
  }

  private async findOne(
    condition: string,
    values: SqlValue[],
    options: { soloActivos: boolean }
  ): Promise<User | null> {
    const filtroActivo = options.soloActivos ? "AND u.activo = true" : "";

    const { rows } = await this.databasePool.query<UserRow>(
      `
        SELECT
          u.id,
          u.nombre,
          u.email,
          u.password_hash,
          u.tipo_usuario_id,
          tu.nombre AS tipo_usuario_nombre,
          u.telefono,
          u.imagen_perfil_url,
          u.fecha_registro,
          u.es_premium,
          u.activo
        FROM usuario u
        INNER JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
        WHERE ${condition}
          ${filtroActivo}
        LIMIT 1
      `,
      values
    );

    const row = rows[0];
    return row ? this.mapToDomain(row) : null;
  }

  private mapToDomain(row: UserRow): User {
    return {
      id: row.id,
      name: row.nombre,
      email: row.email,
      phone: row.telefono,
      imgUrl: row.imagen_perfil_url,
      passwordHash: row.password_hash,
      userTypeId: row.tipo_usuario_id,
      userType: row.tipo_usuario_nombre,
      registeredAt: row.fecha_registro,
      isPremium: Boolean(row.es_premium),
      active: Boolean(row.activo),
    };
  }
}
