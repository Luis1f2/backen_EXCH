import type {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

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

export class UpdateUserStatus {
  constructor(private readonly pool: Pool) {}

  async execute(
    actingAdminId: string,
    targetUserId: string,
    input: UpdateUserStatusInput,
  ): Promise<UpdatedUser> {
    const [existingRows] =
      await this.pool.execute<RowDataPacket[]>(
        `SELECT u.id, tu.nombre AS tipo_usuario
         FROM usuario u
         INNER JOIN tipo_usuario tu
           ON tu.id = u.tipo_usuario_id
         WHERE u.id = ?
         LIMIT 1`,
        [targetUserId],
      );

    const existingUser = existingRows[0];

    if (!existingUser) {
      throw new AppError(
        "Usuario no encontrado",
        404,
      );
    }

    if (
      actingAdminId === targetUserId &&
      input.activo === false
    ) {
      throw new AppError(
        "No puedes desactivar tu propia cuenta",
        400,
      );
    }

    if (
      actingAdminId === targetUserId &&
      input.tipoUsuarioNombre !== undefined &&
      input.tipoUsuarioNombre !== "admin_plataforma"
    ) {
      throw new AppError(
        "No puedes retirar tu propio rol de administrador",
        400,
      );
    }

    if (input.email !== undefined) {
      const normalizedEmail =
        input.email.trim().toLowerCase();

      const [emailRows] =
        await this.pool.execute<RowDataPacket[]>(
          `SELECT id
           FROM usuario
           WHERE email = ?
             AND id <> ?
           LIMIT 1`,
          [normalizedEmail, targetUserId],
        );

      if (emailRows.length > 0) {
        throw new AppError(
          "El correo ya está registrado",
          409,
        );
      }
    }

    let userTypeId: string | undefined;

    if (input.tipoUsuarioNombre !== undefined) {
      const [typeRows] =
        await this.pool.execute<RowDataPacket[]>(
          `SELECT id
           FROM tipo_usuario
           WHERE nombre = ?
           LIMIT 1`,
          [input.tipoUsuarioNombre],
        );

      if (typeRows.length === 0) {
        throw new AppError(
          "Tipo de usuario no válido",
          400,
        );
      }

      userTypeId = typeRows[0].id as string;
    }

    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    if (input.nombre !== undefined) {
      fields.push("nombre = ?");
      values.push(input.nombre.trim());
    }

    if (input.email !== undefined) {
      fields.push("email = ?");
      values.push(
        input.email.trim().toLowerCase(),
      );
    }

    if (input.telefono !== undefined) {
      fields.push("telefono = ?");
      values.push(input.telefono);
    }

    if (input.activo !== undefined) {
      fields.push("activo = ?");
      values.push(input.activo ? 1 : 0);
    }

    if (userTypeId !== undefined) {
      fields.push("tipo_usuario_id = ?");
      values.push(userTypeId);
    }

    if (fields.length === 0) {
      throw new AppError(
        "No se proporcionaron datos para actualizar",
        400,
      );
    }

    values.push(targetUserId);

    await this.pool.execute<ResultSetHeader>(
      `UPDATE usuario
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values,
    );

    return this.getUser(targetUserId);
  }

  private async getUser(
    userId: string,
  ): Promise<UpdatedUser> {
    const [rows] =
      await this.pool.execute<RowDataPacket[]>(
        `SELECT
           u.id,
           u.nombre,
           u.email,
           u.telefono,
           u.activo,
           tu.nombre AS tipo_usuario
         FROM usuario u
         INNER JOIN tipo_usuario tu
           ON tu.id = u.tipo_usuario_id
         WHERE u.id = ?
         LIMIT 1`,
        [userId],
      );

    const row = rows[0];

    if (!row) {
      throw new AppError(
        "Usuario no encontrado",
        404,
      );
    }

    return {
      id: row.id as string,
      nombre: row.nombre as string,
      email: row.email as string,
      telefono: row.telefono as string | null,
      activo: Boolean(row.activo),
      tipoUsuario: row.tipo_usuario as string,
    };
  }
}