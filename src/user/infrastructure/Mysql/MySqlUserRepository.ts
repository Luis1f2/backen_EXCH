import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type { User } from "../../domain/entities/User.js";

import type {
  CreateUserData,
  UpdateUserData,
  UserRepository
} from "../../domain/repositories/UserRepository.js";

interface UserRow extends RowDataPacket {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  tipo_usuario_id: string;
  telefono: string | null;
  fecha_registro: Date;
  es_premium: number;
  activo: number;
}

interface UserTypeRow extends RowDataPacket {
  id: string;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlUserRepository implements UserRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateUserData): Promise<User> {
    await this.databasePool.execute(
      `INSERT INTO usuario (
        id,
        nombre,
        email,
        password_hash,
        tipo_usuario_id,
        telefono
      ) VALUES (?, ?, ?, ?, ?, ?)`,
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
    return this.findOne("id = ?", [id], { soloActivos: true });
  }

  // El correo es unico para siempre en la tabla (uq_usuario_email no distingue
  // activo), asi que la busqueda debe ver tambien cuentas borradas: si no, el
  // registro/actualizacion fallaria con el error generico de MySQL en vez de
  // un mensaje claro de "correo ya registrado".
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne("email = ?", [email], { soloActivos: false });
  }

  async findUserTypeIdByName(name: string): Promise<string | null> {
    const [rows] = await this.databasePool.execute<UserTypeRow[]>(
      `SELECT id
       FROM tipo_usuario
       WHERE nombre = ?
       LIMIT 1`,
      [name]
    );

    return rows[0]?.id ?? null;
  }

  async update(
    id: string,
    data: UpdateUserData
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.name !== undefined) {
      fields.push("nombre = ?");
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push("email = ?");
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push("telefono = ?");
      values.push(data.phone);
    }

    if (data.passwordHash !== undefined) {
      fields.push("password_hash = ?");
      values.push(data.passwordHash);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.execute(
      `UPDATE usuario
       SET ${fields.join(", ")}
       WHERE id = ?
       AND activo = 1`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        `UPDATE usuario
         SET activo = 0
         WHERE id = ?
         AND activo = 1`,
        [id]
      );

    return result.affectedRows > 0;
  }

  private async findOne(
    condition: string,
    values: SqlValue[],
    options: { soloActivos: boolean }
  ): Promise<User | null> {
    const filtroActivo = options.soloActivos ? "AND activo = 1" : "";

    const [rows] = await this.databasePool.execute<UserRow[]>(
      `SELECT
        id,
        nombre,
        email,
        password_hash,
        tipo_usuario_id,
        telefono,
        fecha_registro,
        es_premium,
        activo
       FROM usuario
       WHERE ${condition}
       ${filtroActivo}
       LIMIT 1`,
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
      passwordHash: row.password_hash,
      userTypeId: row.tipo_usuario_id,
      registeredAt: row.fecha_registro,
      isPremium: Boolean(row.es_premium),
      active: Boolean(row.activo)
    };
  }
}