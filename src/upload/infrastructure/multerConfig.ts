import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";

import { AppError } from "../../user/application/errors/AppError.js";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function buildStorage(subfolder: "negocios" | "resenas") {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, `uploads/${subfolder}`);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${randomUUID()}${ext}`);
    }
  });
}

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Solo se permiten imagenes JPG, PNG o WEBP", 400));
  }
}

export const uploadNegocio = multer({
  storage: buildStorage("negocios"),
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES }
});

export const uploadResena = multer({
  storage: buildStorage("resenas"),
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES }
});
