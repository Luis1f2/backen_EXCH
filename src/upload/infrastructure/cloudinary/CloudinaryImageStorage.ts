import type {
  ImageStorage,
  StoredImage,
} from "../../application/ports/ImageStorage.js";

import {
  cloudinary,
} from "./cloudinaryClient.js";

export class CloudinaryImageStorage
  implements ImageStorage
{
  async upload(
    buffer: Buffer,
    folder: string
  ): Promise<StoredImage> {
    return new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                `explorachiapas/${folder}`,

              resource_type:
                "image",
            },

            (
              error,
              result
            ) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result) {
                reject(
                  new Error(
                    "Cloudinary no devolvió información de la imagen"
                  )
                );

                return;
              }

              resolve({
                url:
                  result.secure_url,

                publicId:
                  result.public_id,
              });
            }
          );

        uploadStream.end(
          buffer
        );
      }
    );
  }

  async delete(
    publicId: string
  ): Promise<void> {
    if (!publicId.trim()) {
      return;
    }

    const result =
    await cloudinary.uploader.destroy(
        publicId,
        {
            resource_type: "image",
            invalidate: true,
        }
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
      `No se pudo eliminar la imagen de Cloudinary: ${result.result}`
    );
  }
}