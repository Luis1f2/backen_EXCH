import type {
  Pool,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from
  "../../../user/application/errors/AppError.js";

import {
  removePreviousUpload
} from "../../shared/uploadFileUtils.js";

interface UserProfileImageRow
  extends RowDataPacket {
  imagen_perfil_url: string | null;
}

export class DeleteUserProfileImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    userId: string
  ): Promise<void> {
    /*
     * Primero comprobamos que el usuario
     * exista y obtenemos su imagen actual.
     */
    const [rows] =
      await this.pool.execute<
        UserProfileImageRow[]
      >(
        `SELECT imagen_perfil_url
         FROM usuario
         WHERE id = ?
           AND activo = 1
         LIMIT 1`,
        [userId]
      );

    const user = rows[0];

    if (!user) {
      throw new AppError(
        "Usuario no encontrado",
        404
      );
    }

    /*
     * Quitamos la referencia de la BD.
     *
     * Esto funciona incluso si el usuario
     * ya tenía imagen_perfil_url = NULL.
     */
    await this.pool.execute(
      `UPDATE usuario
       SET imagen_perfil_url = NULL
       WHERE id = ?
         AND activo = 1`,
      [userId]
    );

    /*
     * Si había una imagen anterior,
     * eliminamos también el archivo físico.
     */
    await removePreviousUpload(
      user.imagen_perfil_url,
      "usuarios"
    );
  }
}