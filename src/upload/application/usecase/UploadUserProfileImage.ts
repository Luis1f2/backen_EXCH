import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import { AppError } from
  "../../../user/application/errors/AppError.js";

import { removePreviousUpload } from
  "../../shared/uploadFileUtils.js";

interface UserImageRow
  extends RowDataPacket {
  imagen_perfil_url: string | null;
}

export interface UploadUserProfileImageResult {
  usuarioId: string;
  imageProfileUrl: string;
}

export class UploadUserProfileImage {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    userId: string,
    filename: string
  ): Promise<UploadUserProfileImageResult> {
    const [rows] =
      await this.pool.execute<
        UserImageRow[]
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

    const imageProfileUrl =
      `/uploads/usuarios/${filename}`;

    const [result] =
      await this.pool.execute<
        ResultSetHeader
      >(
        `UPDATE usuario
         SET imagen_perfil_url = ?
         WHERE id = ?
           AND activo = 1`,
        [
          imageProfileUrl,
          userId
        ]
      );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Usuario no encontrado",
        404
      );
    }

    await removePreviousUpload(
      user.imagen_perfil_url,
      "usuarios"
    );

    return {
      usuarioId: userId,
      imageProfileUrl
    };
  }
}