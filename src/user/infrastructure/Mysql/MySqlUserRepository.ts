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
  uuid: string;
  nombre_usuario: string;
  correo: string | null;
  numero_telefonico: string | null;
  contrasena_hash: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  activo: number;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlUserRepository implements UserRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateUserData): Promise<User> {
    await this.databasePool.execute(
      `INSERT INTO usuarios (
        uuid,
        nombre_usuario,
        correo,
        numero_telefonico,
        contrasena_hash
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        data.id,
        data.username,
        data.email,
        data.phone,
        data.passwordHash
      ]
    );

    const user = await this.findById(data.id);

    if (!user) {
      throw new Error("No se pudo recuperar el usuario creado");
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne("uuid = ?", [id]);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne("nombre_usuario = ?", [username]);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne("correo = ?", [email]);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.findOne("numero_telefonico = ?", [phone]);
  }

  async update(
    id: string,
    data: UpdateUserData
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.username !== undefined) {
      fields.push("nombre_usuario = ?");
      values.push(data.username);
    }

    if (data.email !== undefined) {
      fields.push("correo = ?");
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push("numero_telefonico = ?");
      values.push(data.phone);
    }

    if (data.passwordHash !== undefined) {
      fields.push("contrasena_hash = ?");
      values.push(data.passwordHash);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.execute(
      `UPDATE usuarios
       SET ${fields.join(", ")}
       WHERE uuid = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        "DELETE FROM usuarios WHERE uuid = ?",
        [id]
      );

    return result.affectedRows > 0;
  }

  private async findOne(
  condition: string,
  values: SqlValue[]
): Promise<User | null> {
  const [rows] = await this.databasePool.execute<UserRow[]>(
    `SELECT
      uuid,
      nombre_usuario,
      correo,
      numero_telefonico,
      contrasena_hash,
      fecha_creacion,
      fecha_actualizacion,
      activo
     FROM usuarios
     WHERE ${condition}
     LIMIT 1`,
    values
  );

  const row = rows[0];

  return row ? this.mapToDomain(row) : null;
}

  private mapToDomain(row: UserRow): User {
    return {
      id: row.uuid,
      username: row.nombre_usuario,
      email: row.correo,
      phone: row.numero_telefonico,
      passwordHash: row.contrasena_hash,
      createdAt: row.fecha_creacion,
      updatedAt: row.fecha_actualizacion,
      active: Boolean(row.activo)
    };
  }
}