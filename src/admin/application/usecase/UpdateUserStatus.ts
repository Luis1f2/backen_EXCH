import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { AppError } from "../../../user/application/errors/AppError.js";

export interface UpdateUserStatusInput {
  activo?: boolean;
  tipoUsuarioNombre?: string;
}

export class UpdateUserStatus {
  constructor(private readonly pool: Pool) {}

  async execute(
    targetUserId: string,
    input: UpdateUserStatusInput
  ): Promise<{ id: string; activo: boolean; tipoUsuario: string }> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT id FROM usuario WHERE id = ? LIMIT 1",
      [targetUserId]
    );

    if (!(rows as RowDataPacket[]).length) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (input.tipoUsuarioNombre !== undefined) {
      const [tipoRows] = await this.pool.execute<RowDataPacket[]>(
        "SELECT id FROM tipo_usuario WHERE nombre = ? LIMIT 1",
        [input.tipoUsuarioNombre]
      );

      if (!(tipoRows as RowDataPacket[]).length) {
        throw new AppError("Tipo de usuario no válido", 400);
      }

      await this.pool.execute(
        "UPDATE usuario SET tipo_usuario_id = (SELECT id FROM tipo_usuario WHERE nombre = ?) WHERE id = ?",
        [input.tipoUsuarioNombre, targetUserId]
      );
    }

    if (input.activo !== undefined) {
      await this.pool.execute<ResultSetHeader>(
        "UPDATE usuario SET activo = ? WHERE id = ?",
        [input.activo ? 1 : 0, targetUserId]
      );
    }

    const [updated] = await this.pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.activo, tu.nombre AS tipo_usuario
       FROM usuario u
       JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
       WHERE u.id = ? LIMIT 1`,
      [targetUserId]
    );

    const row = (updated as RowDataPacket[])[0];

    return {
      id: row.id as string,
      activo: Boolean(row.activo),
      tipoUsuario: row.tipo_usuario as string
    };
  }
}
