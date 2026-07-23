import type {
  Pool,
} from "pg";

import {
  JwtTokenService,
} from "../../user/infrastructure/security/SecurityAdapters.js";

import {
  CloudinaryImageStorage,
} from "../../upload/infrastructure/cloudinary/CloudinaryImageStorage.js";

import {
  DestinationProposalService,
} from "../application/DestinationProposalService.js";

import {
  PostgresDestinationProposalRepository,
} from "./PostgresDestinationProposalRepository.js";

import {
  DestinationProposalController,
} from "./DestinationProposalController.js";

import {
  createDestinationProposalRoutes,
} from "./routes/destinationProposalRoutes.js";

export function createDestinationProposalModule(
  pool: Pool,

  jwtSecret: string,
) {
  const repository =
    new PostgresDestinationProposalRepository(
      pool,
    );

  const imageStorage =
    new CloudinaryImageStorage();

  const service =
    new DestinationProposalService(
      repository,
      imageStorage,
    );

  const controller =
    new DestinationProposalController(
      service,
    );

  const tokenService =
    new JwtTokenService(
      jwtSecret,
    );

  return createDestinationProposalRoutes(
    controller,
    tokenService,
    pool,
  );
}
