import fs from "node:fs/promises";

import type {
  ImageStorage,
} from "../application/ports/ImageStorage.js";

export type StoredUploadFolder =
  | "negocios"
  | "resenas"
  | "promociones"
  | "eventos"
  | "usuarios";

function isNodeError(
  error: unknown
): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

/*
 * Compatibilidad temporal con código legado.
 *
 * Los uploads nuevos ya no usan disco local,
 * pero mantenemos esta función mientras no
 * existan referencias antiguas en controllers.
 */
export async function removeUploadedFileByPath(
  filePath:
    | string
    | undefined
): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(
      filePath
    );
  } catch (error) {
    if (
      isNodeError(error) &&
      error.code === "ENOENT"
    ) {
      return;
    }

    console.error(
      "No se pudo eliminar el archivo local:",
      error
    );
  }
}

function extractCloudinaryPublicId(
  publicUrl: string,
  folder: StoredUploadFolder
): string | null {
  try {
    const url =
      new URL(publicUrl);

    if (
      url.hostname !==
      "res.cloudinary.com"
    ) {
      return null;
    }

    /*
     * Ejemplo:
     *
     * https://res.cloudinary.com/.../upload/v123/
     * explorachiapas/eventos/abc.jpg
     *
     * Buscamos directamente nuestro namespace,
     * ignorando transformaciones/versiones previas.
     */
    const marker =
      `explorachiapas/${folder}/`;

    const decodedPath =
      decodeURIComponent(
        url.pathname
      );

    const markerIndex =
      decodedPath.indexOf(
        marker
      );

    if (
      markerIndex === -1
    ) {
      return null;
    }

    const assetPath =
      decodedPath.slice(
        markerIndex
      );

    /*
     * Cloudinary public_id no incluye
     * la extensión del recurso.
     */
    return assetPath.replace(
      /\.[^/.]+$/,
      ""
    );
  } catch {
    return null;
  }
}

export async function removePreviousUpload(
  publicUrl:
    | string
    | null
    | undefined,

  folder:
    StoredUploadFolder,

  imageStorage:
    ImageStorage
): Promise<void> {
  if (!publicUrl) {
    return;
  }

  /*
   * Ruta antigua de Render.
   *
   * El archivo físico probablemente ya fue
   * eliminado por un redeploy. No hacemos nada.
   */
  if (
    publicUrl.startsWith(
      `/uploads/${folder}/`
    )
  ) {
    return;
  }

  const publicId =
    extractCloudinaryPublicId(
      publicUrl,
      folder
    );

  if (!publicId) {
    /*
     * No tocar URLs externas desconocidas.
     */
    return;
  }

  try {
    await imageStorage.delete(
      publicId
    );
  } catch (error) {
    /*
     * Una imagen anterior que no se pudo
     * eliminar no debe invalidar la operación
     * principal sobre la base de datos.
     */
    console.error(
      "No se pudo eliminar la imagen anterior:",
      error
    );
  }
}