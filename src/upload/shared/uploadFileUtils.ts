import fs from "node:fs/promises";
import path from "node:path";

export type StoredUploadFolder =
  | "negocios"
  | "resenas"
  | "promociones"
  | "eventos"
  | "usuarios";

const UPLOADS_ROOT = path.resolve(
  process.cwd(),
  "uploads"
);

function isNodeError(
  error: unknown
): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

export async function removeUploadedFileByPath(
  filePath: string | undefined
): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (
      isNodeError(error) &&
      error.code === "ENOENT"
    ) {
      return;
    }

    console.error(
      "No se pudo eliminar el archivo:",
      error
    );
  }
}

export async function removePreviousUpload(
  publicUrl: string | null | undefined,
  folder: StoredUploadFolder
): Promise<void> {
  if (!publicUrl) {
    return;
  }

  const expectedPrefix =
    `/uploads/${folder}/`;

  /*
   * Evita borrar archivos externos
   * o rutas que no pertenecen a uploads.
   */
  if (!publicUrl.startsWith(expectedPrefix)) {
    return;
  }

  const filename =
    path.basename(publicUrl);

  const filePath = path.join(
    UPLOADS_ROOT,
    folder,
    filename
  );

  await removeUploadedFileByPath(filePath);
}