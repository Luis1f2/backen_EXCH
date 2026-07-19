import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";
import { removePreviousUpload } from "../../shared/uploadFileUtils.js";

interface UserImageRow {
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
    const { rows } = await this.pool.query<UserImageRow>(
      `SELECT imagen_perfil_url
       FROM usuario
       WHERE id = $1
         AND activo = true
       LIMIT 1`,
      [userId]
    );

    const user = rows[0];

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const imageProfileUrl = `/uploads/usuarios/${filename}`;

    const { rowCount } = await this.pool.query(
      `UPDATE usuario
       SET imagen_perfil_url = $1
       WHERE id = $2
         AND activo = true`,
      [imageProfileUrl, userId]
    );

    if ((rowCount ?? 0) === 0) {
      throw new AppError("Usuario no encontrado", 404);
    }

    await removePreviousUpload(user.imagen_perfil_url, "usuarios");

    return { usuarioId: userId, imageProfileUrl };
  }
}
