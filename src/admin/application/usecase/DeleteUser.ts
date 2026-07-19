import type {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { AppError } from "../../../user/application/errors/AppError.js";

export class DeleteUser {
  constructor(private readonly pool: Pool) {}

  async execute(
    actingAdminId: string,
    targetUserId: string,
  ): Promise<void> {
    if (actingAdminId === targetUserId) {
      throw new AppError(
        "No puedes eliminar tu propia cuenta",
        400,
      );
    }

    const [rows] =
      await this.pool.execute<RowDataPacket[]>(
        `SELECT id, activo
         FROM usuario
         WHERE id = ?
         LIMIT 1`,
        [targetUserId],
      );

    if (rows.length === 0) {
      throw new AppError(
        "Usuario no encontrado",
        404,
      );
    }

    if (!Boolean(rows[0].activo)) {
      throw new AppError(
        "El usuario ya está desactivado",
        409,
      );
    }

    const [result] =
      await this.pool.execute<ResultSetHeader>(
        `UPDATE usuario
         SET activo = 0
         WHERE id = ?
           AND activo = 1`,
        [targetUserId],
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "No se pudo desactivar el usuario",
        500,
      );
    }
  }
}