import type {
  ImageStorage,
} from "../../upload/application/ports/ImageStorage.js";

import type {
  DestinationProposal,
  DestinationProposalStatus,
} from "../domain/DestinationProposal.js";

import type {
  PostgresDestinationProposalRepository,
} from "../infrastructure/PostgresDestinationProposalRepository.js";

import {
  AppError,
} from "../../user/application/errors/AppError.js";

export class DestinationProposalService {
  constructor(
    private readonly repository:
      PostgresDestinationProposalRepository,

    private readonly imageStorage:
      ImageStorage,
  ) {}

  async create(
    userId: string,

    input: {
      name: string;

      description:
        string | null;

      categoryId: string;

      locationId: string;
    },
  ): Promise<DestinationProposal> {
    const categoryValid =
      await this.repository
        .categoryCanBeUsed(
          input.categoryId,
        );

    if (!categoryValid) {
      throw new AppError(
        "La categoría seleccionada no está habilitada para destinos",
        400,
      );
    }

    const locationExists =
      await this.repository
        .locationExists(
          input.locationId,
        );

    if (!locationExists) {
      throw new AppError(
        "La ubicación seleccionada no existe",
        400,
      );
    }

    return this.repository.create(
      userId,
      input,
    );
  }

  async uploadImages(
    proposalId: string,

    userId: string,

    files:
      Express.Multer.File[],
  ) {
    const proposal =
      await this.getOwnedPendingProposal(
        proposalId,
        userId,
      );

    if (
      files.length === 0
    ) {
      throw new AppError(
        "Debes enviar al menos una imagen",
        400,
      );
    }

    const currentCount =
      await this.repository
        .countImages(
          proposal.id,
        );

    if (
      currentCount +
      files.length >
      5
    ) {
      throw new AppError(
        `La propuesta puede tener como máximo 5 imágenes. Actualmente tiene ${currentCount}.`,
        400,
      );
    }

    const uploaded:
      Array<{
        url: string;
        publicId: string;
      }> = [];

    try {
      for (
        const file
        of files
      ) {
        const stored =
          await this.imageStorage
            .upload(
              file.buffer,

              `destination-proposals/${proposal.id}`,
            );

        uploaded.push(
          stored,
        );
      }

      return await this.repository
        .addImages(
          proposal.id,
          uploaded,
        );
    } catch (error) {
      /*
       * Si falla la BD o una subida posterior,
       * limpiamos cualquier imagen que ya haya
       * llegado a Cloudinary para evitar archivos
       * huérfanos.
       */
      await Promise.allSettled(
        uploaded.map(
          (
            image,
          ) =>
            this.imageStorage
              .delete(
                image.publicId,
              ),
        ),
      );

      throw error;
    }
  }

  async deleteImage(
    proposalId: string,

    imageId: string,

    userId: string,
  ) {
    const proposal =
      await this.getOwnedPendingProposal(
        proposalId,
        userId,
      );

    const image =
      await this.repository
        .findImage(
          proposal.id,
          imageId,
        );

    if (!image) {
      throw new AppError(
        "Imagen no encontrada",
        404,
      );
    }

    /*
     * Primero eliminamos el recurso externo.
     * Solo después quitamos la referencia
     * persistida.
     */
    await this.imageStorage
      .delete(
        image.imagePublicId,
      );

    const deleted =
      await this.repository
        .deleteImageRecord(
          proposal.id,
          image.id,
        );

    if (!deleted) {
      throw new AppError(
        "No se pudo eliminar la imagen",
        500,
      );
    }

    return this.repository
      .findById(
        proposal.id,
      );
  }

  private async getOwnedPendingProposal(
    proposalId: string,

    userId: string,
  ) {
    const proposal =
      await this.repository
        .findById(
          proposalId,
        );

    if (!proposal) {
      throw new AppError(
        "Propuesta no encontrada",
        404,
      );
    }

    if (
      proposal.userId !==
      userId
    ) {
      throw new AppError(
        "No tienes permisos sobre esta propuesta",
        403,
      );
    }

    if (
      proposal.status !==
      "pendiente"
    ) {
      throw new AppError(
        "Solo puedes modificar imágenes mientras la propuesta esté pendiente",
        409,
      );
    }

    return proposal;
  }

  async listMine(
    userId: string,
  ) {
    return this.repository
      .listMine(
        userId,
      );
  }

  async listAdmin(
    status:
      DestinationProposalStatus
      | undefined,

    limit: number,

    offset: number,
  ) {
    return this.repository
      .listAdmin(
        status,
        limit,
        offset,
      );
  }

  async getAdmin(
    id: string,
  ) {
    const proposal =
      await this.repository
        .findById(id);

    if (!proposal) {
      throw new AppError(
        "Propuesta no encontrada",
        404,
      );
    }

    return proposal;
  }

  async review(
    proposalId: string,

    adminUserId: string,

    input:
      | {
          action:
            "approve";
        }
      | {
          action:
            "reject";

          reason:
            string;
        },
  ) {
    if (
      input.action ===
      "approve"
    ) {
      return this.repository
        .approve(
          proposalId,
          adminUserId,
        );
    }

    return this.repository
      .reject(
        proposalId,
        adminUserId,
        input.reason,
      );
  }
}
