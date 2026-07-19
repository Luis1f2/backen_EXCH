import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface UpdateUserStatusInput {
  nombre?: string;
  email?: string;
  telefono?: string | null;
  activo?: boolean;
  tipoUsuarioNombre?: string;
}

export interface UpdatedUser {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  tipoUsuario: string;
}

interface ExistingUserRow {
  id: string;
  tipo_usuario: string;
}

interface UpdatedUserRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  tipo_usuario: string;
}

export class UpdateUserStatus {
  constructor(private readonly pool: Pool) {}

  async execute(
    actingAdminId: string,
    targetUserId: string,
    input: UpdateUserStatusInput,
  ): Promise<UpdatedUser> {
    const { rows: existingRows } = await this.pool.query<ExistingUserRow>(
      `SELECT u.id, tu.nombre AS tipo_usuario
       FROM usuario u
       INNER JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
       WHERE u.id = $1
       LIMIT 1`,
      [targetUserId],
    );

    const existingUser = existingRows[0];

    if (!existingUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (actingAdminId === targetUserId && input.activo === false) {
      throw new AppError("No puedes desactivar tu propia cuenta", 400);
    }

    if (
      actingAdminId === targetUserId &&
      input.tipoUsuarioNombre !== undefined &&
      input.tipoUsuarioNombre !== "admin_plataforma"
    ) {
      throw new AppError("No puedes retirar tu propio rol de administrador", 400);
    }

    if (input.email !== undefined) {
      const normalizedEmail = input.email.trim().toLowerCase();

      const { rows: emailRows } = await this.pool.query<{ id: string }>(
        `SELECT id
         FROM usuario
         WHERE email = $1
           AND id <> $2
         LIMIT 1`,
        [normalizedEmail, targetUserId],
      );

      if (emailRows.length > 0) {
        throw new AppError("El correo ya está registrado", 409);
      }
    }

    let userTypeId: string | undefined;

    if (input.tipoUsuarioNombre !== undefined) {
      const { rows: typeRows } = await this.pool.query<{ id: string }>(
        `SELECT id
         FROM tipo_usuario
         WHERE nombre = $1
         LIMIT 1`,
        [input.tipoUsuarioNombre],
      );

      if (typeRows.length === 0) {
        throw new AppError("Tipo de usuario no válido", 400);
      }

      userTypeId = typeRows[0].id;
    }

    let p = 0;
    const fields: string[] = [];
    const values: Array<string | number | boolean | null> = [];

    if (input.nombre !== undefined) {
      fields.push(`nombre = $${++p}`);
      values.push(input.nombre.trim());
    }

    if (input.email !== undefined) {
      fields.push(`email = $${++p}`);
      values.push(input.email.trim().toLowerCase());
    }

    if (input.telefono !== undefined) {
      fields.push(`telefono = $${++p}`);
      values.push(input.telefono);
    }

    if (input.activo !== undefined) {
      fields.push(`activo = $${++p}`);
      values.push(input.activo);
    }

    if (userTypeId !== undefined) {
      fields.push(`tipo_usuario_id = $${++p}`);
      values.push(userTypeId);
    }

    if (fields.length === 0) {
      throw new AppError("No se proporcionaron datos para actualizar", 400);
    }

    values.push(targetUserId);

    await this.pool.query(
      `UPDATE usuario
       SET ${fields.join(", ")}
       WHERE id = $${p + 1}`,
      values,
    );

    return this.getUser(targetUserId);
  }

  private async getUser(userId: string): Promise<UpdatedUser> {
    const { rows } = await this.pool.query<UpdatedUserRow>(
      `SELECT
         u.id,
         u.nombre,
         u.email,
         u.telefono,
         u.activo,
         tu.nombre AS tipo_usuario
       FROM usuario u
       INNER JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
       WHERE u.id = $1
       LIMIT 1`,
      [userId],
    );

    const row = rows[0];

    if (!row) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      activo: Boolean(row.activo),
      tipoUsuario: row.tipo_usuario,
    };
  }
}
