import type { Pool } from "pg";

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

    const { rows } = await this.pool.query<{ id: string; activo: boolean }>(
      `SELECT id, activo
       FROM usuario
       WHERE id = $1
       LIMIT 1`,
      [targetUserId],
    );

    if (rows.length === 0) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (!rows[0].activo) {
      throw new AppError("El usuario ya está desactivado", 409);
    }

    const { rowCount } = await this.pool.query(
      `UPDATE usuario
       SET activo = false
       WHERE id = $1
         AND activo = true`,
      [targetUserId],
    );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("No se pudo desactivar el usuario", 500);
    }
  }
}
