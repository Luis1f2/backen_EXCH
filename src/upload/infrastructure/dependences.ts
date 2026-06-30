import type { Pool } from "mysql2/promise";

import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";

import { UploadBusinessImage } from "../application/usecase/UploadBusinessImage.js";
import { UploadResenaImage } from "../application/usecase/UploadResenaImage.js";

import { UploadBusinessImageController } from "./controller/UploadBusinessImageController.js";
import { UploadResenaImageController } from "./controller/UploadResenaImageController.js";

import { createUploadRoutes } from "./routes/uploadRoutes.js";

export function createUploadModule(pool: Pool, jwtSecret: string) {
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    business: new UploadBusinessImageController(new UploadBusinessImage(pool)),
    resena: new UploadResenaImageController(new UploadResenaImage(pool))
  };

  return createUploadRoutes(controllers, tokenService);
}
