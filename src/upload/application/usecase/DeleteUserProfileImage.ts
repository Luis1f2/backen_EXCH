import type { Pool } from "pg";

import type {
  ImageStorage,
} from "../ports/ImageStorage.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import {
  removePreviousUpload,
} from "../../shared/uploadFileUtils.js";

interface UserProfileImageRow {
  imagen_perfil_url: string | null;
}

export class DeleteUserProfileImage {
  constructor(
    private readonly pool: Pool,
    private readonly imageStorage: ImageStorage
  ) {}

  async execute(
    userId: string
  ): Promise<void> {
    const { rows } =
      await this.pool.query<UserProfileImageRow>(
        `SELECT imagen_perfil_url
         FROM usuario
         WHERE id = $1
           AND activo = true
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

    await this.pool.query(
      `UPDATE usuario
       SET imagen_perfil_url = NULL
       WHERE id = $1
         AND activo = true`,
      [userId]
    );

    await removePreviousUpload(
      user.imagen_perfil_url,
      "usuarios",
      this.imageStorage
    );
  }
}