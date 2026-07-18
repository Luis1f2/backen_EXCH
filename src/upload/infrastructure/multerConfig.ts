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

const MAX_SIZE_BYTES =
  5 * 1024 * 1024;

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

  /*
   * Evita ENOENT cuando la carpeta
   * todavía no existe.
   */
  fs.mkdirSync(destinationPath, {
    recursive: true,
  });

  return multer.diskStorage({
    destination: (
      _request,
      _file,
      callback
    ) => {
      callback(null, destinationPath);
    },

    filename: (
      _request,
      file,
      callback
    ) => {
      const extension =
        EXTENSION_BY_MIME[file.mimetype];

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
  if (EXTENSION_BY_MIME[file.mimetype]) {
    callback(null, true);
    return;
  }

  callback(
    new AppError(
      "Solo se permiten imágenes JPG, PNG o WEBP",
      400
    )
  );
}

function createImageUploader(
  folder: UploadFolder
) {
  return multer({
    storage: buildStorage(folder),

    fileFilter,

    limits: {
      fileSize: MAX_SIZE_BYTES,
      files: 1,
    },
  });
}

export const uploadNegocio =
  createImageUploader("negocios");

export const uploadResena =
  createImageUploader("resenas");

export const uploadPromocion =
  createImageUploader("promociones");

export const uploadEvento =
  createImageUploader("eventos");

export const uploadUsuario =
  createImageUploader("usuarios");