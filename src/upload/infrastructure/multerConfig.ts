import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

import { AppError } from
  "../../user/application/errors/AppError.js";

type UploadFolder =
  | "negocios"
  | "resenas"
  | "promociones"
  | "eventos"
  | "usuarios";

/*
 * Límites máximos de ENTRADA.
 *
 * Más adelante procesaremos las imágenes
 * para que el archivo almacenado sea mucho
 * más pequeño que el original.
 */
const PROFILE_MAX_SIZE_BYTES =
  10 * 1024 * 1024;

const REVIEW_MAX_SIZE_BYTES =
  10 * 1024 * 1024;

const CONTENT_MAX_SIZE_BYTES =
  12 * 1024 * 1024;

const EXTENSION_BY_MIME:
  Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

function buildStorage(
  subfolder: UploadFolder
) {
  const destinationPath = path.resolve(
    process.cwd(),
    "uploads",
    subfolder
  );

  fs.mkdirSync(destinationPath, {
    recursive: true,
  });

  return multer.diskStorage({
    destination: (
      _request,
      _file,
      callback
    ) => {
      callback(
        null,
        destinationPath
      );
    },

    filename: (
      _request,
      file,
      callback
    ) => {
      const extension =
        EXTENSION_BY_MIME[
          file.mimetype
        ];

      callback(
        null,
        `${randomUUID()}${extension}`
      );
    },
  });
}

function fileFilter(
  _request: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  if (
    EXTENSION_BY_MIME[file.mimetype]
  ) {
    callback(
      null,
      true
    );

    return;
  }

  callback(
    new AppError(
      "Formato de imagen no compatible. Usa JPG, PNG o WEBP",
      400
    )
  );
}

function createImageUploader(
  folder: UploadFolder,
  maxSizeBytes: number
) {
  return multer({
    storage:
      buildStorage(folder),

    fileFilter,

    limits: {
      fileSize: maxSizeBytes,
      files: 1,
    },
  });
}

/*
 * Negocios:
 * pueden utilizar fotografías de mayor
 * resolución para portadas y galerías.
 */
export const uploadNegocio =
  createImageUploader(
    "negocios",
    CONTENT_MAX_SIZE_BYTES
  );

/*
 * Reseñas:
 * fotografías tomadas principalmente
 * desde dispositivos móviles.
 */
export const uploadResena =
  createImageUploader(
    "resenas",
    REVIEW_MAX_SIZE_BYTES
  );

/*
 * Promociones y eventos:
 * imágenes promocionales o fotografías
 * que pueden tener mayor resolución.
 */
export const uploadPromocion =
  createImageUploader(
    "promociones",
    CONTENT_MAX_SIZE_BYTES
  );

export const uploadEvento =
  createImageUploader(
    "eventos",
    CONTENT_MAX_SIZE_BYTES
  );

/*
 * Perfil:
 * aceptamos hasta 10 MB de entrada.
 *
 * Posteriormente la imagen será
 * redimensionada y comprimida.
 */
export const uploadUsuario =
  createImageUploader(
    "usuarios",
    PROFILE_MAX_SIZE_BYTES
  );