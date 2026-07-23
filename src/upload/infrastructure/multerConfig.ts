import multer from "multer";

import {
  AppError,
} from "../../user/application/errors/AppError.js";

/*
 * Límites máximos de entrada.
 *
 * Multer mantiene temporalmente un único archivo
 * en memoria. La persistencia definitiva se
 * realiza mediante ImageStorage/Cloudinary.
 */
const PROFILE_MAX_SIZE_BYTES =
  10 * 1024 * 1024;

const REVIEW_MAX_SIZE_BYTES =
  10 * 1024 * 1024;

const CONTENT_MAX_SIZE_BYTES =
  12 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

function fileFilter(
  _request: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  if (
    ALLOWED_IMAGE_MIME_TYPES.has(
      file.mimetype
    )
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
  maxSizeBytes: number,
  maxFiles = 1
) {
  return multer({
    storage:
      multer.memoryStorage(),

    fileFilter,

    limits: {
      fileSize:
        maxSizeBytes,

      files:
        maxFiles,
    },
  });
}

export const uploadNegocio =
  createImageUploader(
    CONTENT_MAX_SIZE_BYTES
  );

export const uploadResena =
  createImageUploader(
    REVIEW_MAX_SIZE_BYTES
  );

export const uploadPromocion =
  createImageUploader(
    CONTENT_MAX_SIZE_BYTES
  );

export const uploadEvento =
  createImageUploader(
    CONTENT_MAX_SIZE_BYTES
  );

export const uploadUsuario =
  createImageUploader(
    PROFILE_MAX_SIZE_BYTES
  );
export const uploadDestinationProposalImages =
  createImageUploader(
    CONTENT_MAX_SIZE_BYTES,
    5
  );
