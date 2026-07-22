import type {
  Pool,
} from "pg";

import type {
  ImageStorage,
} from "../ports/ImageStorage.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import {
  removePreviousUpload,
} from "../../shared/uploadFileUtils.js";

interface UserImageRow {
  imagen_perfil_url: string | null;
}

export interface UploadUserProfileImageResult {
  usuarioId: string;
  imageProfileUrl: string;
}

export class UploadUserProfileImage {
  constructor(
    private readonly pool: Pool,
    private readonly imageStorage: ImageStorage
  ) {}

  async execute(
    userId: string,
    buffer: Buffer
  ): Promise<UploadUserProfileImageResult> {
    const { rows } =
      await this.pool.query<UserImageRow>(
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

    const uploaded =
      await this.imageStorage.upload(
        buffer,
        "usuarios"
      );

    try {
      const { rowCount } =
        await this.pool.query(
          `UPDATE usuario
           SET imagen_perfil_url = $1
           WHERE id = $2
             AND activo = true`,
          [
            uploaded.url,
            userId,
          ]
        );

      if ((rowCount ?? 0) === 0) {
        throw new AppError(
          "Usuario no encontrado",
          404
        );
      }
    } catch (error) {
      await this.imageStorage
        .delete(uploaded.publicId)
        .catch(() => undefined);

      throw error;
    }

    await removePreviousUpload(
      user.imagen_perfil_url,
      "usuarios",
      this.imageStorage
    );

    return {
      usuarioId: userId,
      imageProfileUrl:
        uploaded.url,
    };
  }
}