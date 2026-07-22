import type {
  ImageStorage,
  StoredImage,
} from "../../application/ports/ImageStorage.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

import {
  cloudinary,
} from "./cloudinaryClient.js";

type SupportedImageType =
  | "jpeg"
  | "png"
  | "webp";

/*
 * Detecta el tipo real del archivo utilizando
 * su firma binaria (magic bytes).
 *
 * No confía únicamente en:
 * - extensión del archivo;
 * - nombre del archivo;
 * - Content-Type enviado por el cliente.
 */
function detectImageType(
  buffer: Buffer,
): SupportedImageType | null {
  /*
   * Un archivo demasiado pequeño no puede
   * contener una imagen válida de los formatos
   * que aceptamos.
   */
  if (buffer.length < 12) {
    return null;
  }

  /*
   * PNG
   *
   * Firma:
   * 89 50 4E 47 0D 0A 1A 0A
   */
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isPng) {
    return "png";
  }

  /*
   * JPEG
   *
   * Firma inicial:
   * FF D8 FF
   */
  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  if (isJpeg) {
    return "jpeg";
  }

  /*
   * WEBP
   *
   * Estructura inicial:
   *
   * RIFF .... WEBP
   *
   * bytes 0-3  = RIFF
   * bytes 8-11 = WEBP
   */
  const isWebp =
    buffer.subarray(
      0,
      4,
    ).toString("ascii") === "RIFF" &&
    buffer.subarray(
      8,
      12,
    ).toString("ascii") === "WEBP";

  if (isWebp) {
    return "webp";
  }

  return null;
}

export class CloudinaryImageStorage
  implements ImageStorage
{
  async upload(
    buffer: Buffer,
    folder: string,
  ): Promise<StoredImage> {
    /*
     * Segunda capa de validación.
     *
     * Multer valida el MIME declarado por el
     * cliente. Aquí verificamos además que los
     * bytes del archivo correspondan realmente
     * a un formato de imagen permitido.
     */
    const detectedType =
      detectImageType(buffer);

    if (!detectedType) {
      throw new AppError(
        "El archivo no contiene una imagen JPG, PNG o WEBP válida",
        400,
      );
    }

    return new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                `explorachiapas/${folder}`,

              /*
               * Cloudinary también debe tratar
               * obligatoriamente el recurso
               * como imagen.
               */
              resource_type:
                "image",
            },

            (
              error,
              result,
            ) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result) {
                reject(
                  new Error(
                    "Cloudinary no devolvió información de la imagen",
                  ),
                );

                return;
              }

              resolve({
                url:
                  result.secure_url,

                publicId:
                  result.public_id,
              });
            },
          );

        uploadStream.end(
          buffer,
        );
      },
    );
  }

  async delete(
    publicId: string,
  ): Promise<void> {
    if (!publicId.trim()) {
      return;
    }

    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "image",

          invalidate:
            true,
        },
      );

    /*
     * La eliminación es idempotente:
     * si ya no existe, no se considera error.
     */
    if (
      result.result === "ok" ||
      result.result === "not found"
    ) {
      return;
    }

    throw new Error(
      `No se pudo eliminar la imagen de Cloudinary: ${result.result}`,
    );
  }
}