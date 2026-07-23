import {
  randomUUID,
} from "node:crypto";

import type {
  Pool,
  PoolClient,
} from "pg";

import type {
  DestinationProposal,
  DestinationProposalImage,
  DestinationProposalStatus,
} from "../domain/DestinationProposal.js";

import {
  AppError,
} from "../../user/application/errors/AppError.js";

interface ProposalRow {
  id: string;

  usuario_id:
    string | null;

  nombre: string;

  descripcion:
    string | null;

  categoria_id: string;

  categoria_nombre:
    string;

  ubicacion_id: string;

  latitud: string;

  longitud: string;

  direccion:
    string | null;

  municipio:
    string | null;

  estado_ubicacion:
    string | null;

  proveedor_mapa:
    string | null;

  estado:
    DestinationProposalStatus;

  motivo_rechazo:
    string | null;

  revisado_por:
    string | null;

  fecha_revision:
    Date | null;

  destino_creado_id:
    string | null;

  fecha_creacion:
    Date;

  fecha_actualizacion:
    Date;
}

interface ImageRow {
  id: string;

  imagen_url: string;

  imagen_public_id:
    string;

  orden: number;

  fecha_creacion:
    Date;
}

interface LockedProposalRow {
  id: string;

  nombre: string;

  descripcion:
    string | null;

  categoria_id: string;

  ubicacion_id: string;

  estado:
    DestinationProposalStatus;
}

interface CountRow {
  total: string;
}

const SELECT_PROPOSAL = `
  SELECT
    pd.id,
    pd.usuario_id,
    pd.nombre,
    pd.descripcion,

    pd.categoria_id,
    c.nombre
      AS categoria_nombre,

    pd.ubicacion_id,

    u.latitud,
    u.longitud,
    u.direccion,
    u.municipio,
    u.estado
      AS estado_ubicacion,
    u.proveedor_mapa,

    pd.estado,
    pd.motivo_rechazo,
    pd.revisado_por,
    pd.fecha_revision,
    pd.destino_creado_id,
    pd.fecha_creacion,
    pd.fecha_actualizacion

  FROM propuesta_destino pd

  INNER JOIN categoria c
    ON c.id =
      pd.categoria_id

  INNER JOIN ubicacion u
    ON u.id =
      pd.ubicacion_id
`;

export class PostgresDestinationProposalRepository {
  constructor(
    private readonly pool:
      Pool,
  ) {}

  async categoryCanBeUsed(
    categoryId: string,
  ): Promise<boolean> {
    const {
      rows,
    } =
      await this.pool.query<CountRow>(
        `
          SELECT COUNT(*) AS total

          FROM categoria

          WHERE id = $1
            AND aplica_destinos = true
        `,
        [
          categoryId,
        ],
      );

    return Number(
      rows[0]?.total ??
      0,
    ) > 0;
  }

  async locationExists(
    locationId: string,
  ): Promise<boolean> {
    const {
      rows,
    } =
      await this.pool.query<CountRow>(
        `
          SELECT COUNT(*) AS total

          FROM ubicacion

          WHERE id = $1
        `,
        [
          locationId,
        ],
      );

    return Number(
      rows[0]?.total ??
      0,
    ) > 0;
  }

  async create(
    userId: string,

    data: {
      name: string;

      description:
        string | null;

      categoryId: string;

      locationId: string;
    },
  ): Promise<DestinationProposal> {
    const id =
      randomUUID();

    await this.pool.query(
      `
        INSERT INTO propuesta_destino (
          id,
          usuario_id,
          nombre,
          descripcion,
          categoria_id,
          ubicacion_id,
          estado
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'pendiente'
        )
      `,
      [
        id,
        userId,
        data.name,
        data.description,
        data.categoryId,
        data.locationId,
      ],
    );

    const created =
      await this.findById(
        id,
      );

    if (!created) {
      throw new Error(
        "No se pudo recuperar la propuesta creada",
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<
    DestinationProposal | null
  > {
    const {
      rows,
    } =
      await this.pool
        .query<ProposalRow>(
          `
            ${SELECT_PROPOSAL}

            WHERE pd.id = $1

            LIMIT 1
          `,
          [
            id,
          ],
        );

    const row =
      rows[0];

    if (!row) {
      return null;
    }

    const images =
      await this.findImages(
        id,
      );

    return this.map(
      row,
      images,
    );
  }

  async listMine(
    userId: string,
  ): Promise<
    DestinationProposal[]
  > {
    const {
      rows,
    } =
      await this.pool
        .query<ProposalRow>(
          `
            ${SELECT_PROPOSAL}

            WHERE pd.usuario_id = $1

            ORDER BY
              pd.fecha_creacion DESC
          `,
          [
            userId,
          ],
        );

    return this.mapMany(
      rows,
    );
  }

  async listAdmin(
    status:
      DestinationProposalStatus
      | undefined,

    limit: number,

    offset: number,
  ): Promise<
    DestinationProposal[]
  > {
    const values:
      Array<
        string |
        number
      > = [];

    let where = "";

    if (status) {
      values.push(
        status,
      );

      where =
        `WHERE pd.estado = $${values.length}`;
    }

    values.push(
      limit,
    );

    const limitIndex =
      values.length;

    values.push(
      offset,
    );

    const offsetIndex =
      values.length;

    const {
      rows,
    } =
      await this.pool
        .query<ProposalRow>(
          `
            ${SELECT_PROPOSAL}

            ${where}

            ORDER BY
              pd.fecha_creacion DESC

            LIMIT $${limitIndex}

            OFFSET $${offsetIndex}
          `,
          values,
        );

    return this.mapMany(
      rows,
    );
  }

  async approve(
    proposalId: string,

    adminUserId: string,
  ): Promise<DestinationProposal> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        "BEGIN",
      );

      const proposal =
        await this.lockProposal(
          client,
          proposalId,
        );

      if (!proposal) {
        throw new AppError(
          "Propuesta no encontrada",
          404,
        );
      }

      if (
        proposal.estado !==
        "pendiente"
      ) {
        throw new AppError(
          "La propuesta ya fue revisada",
          409,
        );
      }

      const categoryValid =
        await this
          .categoryCanBeUsedWithClient(
            client,
            proposal.categoria_id,
          );

      if (!categoryValid) {
        throw new AppError(
          "La categoría no está habilitada para destinos",
          400,
        );
      }

      const destinationId =
        randomUUID();

      await client.query(
        `
          INSERT INTO destino (
            id,
            nombre,
            descripcion,
            categoria_id,
            ubicacion_id
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
        `,
        [
          destinationId,
          proposal.nombre,
          proposal.descripcion,
          proposal.categoria_id,
          proposal.ubicacion_id,
        ],
      );

      await client.query(
        `
          INSERT INTO destino_metrica (
            destino_id
          )
          VALUES ($1)
        `,
        [
          destinationId,
        ],
      );

      const {
        rows: images,
      } =
        await client
          .query<ImageRow>(
            `
              SELECT
                id,
                imagen_url,
                imagen_public_id,
                orden,
                fecha_creacion

              FROM propuesta_destino_imagen

              WHERE propuesta_id = $1

              ORDER BY orden ASC
            `,
            [
              proposalId,
            ],
          );

      for (
        let index = 0;
        index < images.length;
        index += 1
      ) {
        const image =
          images[index];

        if (!image) {
          continue;
        }

        await client.query(
          `
            INSERT INTO destino_imagen (
              id,
              destino_id,
              url_imagen,
              public_id,
              descripcion,
              orden,
              es_portada,
              activo
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              NULL,
              $5,
              $6,
              true
            )
          `,
          [
            randomUUID(),
            destinationId,
            image.imagen_url,
            image.imagen_public_id,
            index,
            index === 0,
          ],
        );
      }

      const cover =
        images[0];

      if (cover) {
        await client.query(
          `
            UPDATE destino

            SET imagen_url = $1

            WHERE id = $2
          `,
          [
            cover.imagen_url,
            destinationId,
          ],
        );
      }

      await client.query(
        `
          UPDATE propuesta_destino

          SET
            estado =
              'aprobada',

            motivo_rechazo =
              NULL,

            revisado_por =
              $1,

            fecha_revision =
              now(),

            destino_creado_id =
              $2,

            fecha_actualizacion =
              now()

          WHERE id = $3
        `,
        [
          adminUserId,
          destinationId,
          proposalId,
        ],
      );

      await client.query(
        "COMMIT",
      );
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      throw error;
    } finally {
      client.release();
    }

    const reviewed =
      await this.findById(
        proposalId,
      );

    if (!reviewed) {
      throw new Error(
        "No se pudo recuperar la propuesta aprobada",
      );
    }

    return reviewed;
  }

  async reject(
    proposalId: string,

    adminUserId: string,

    reason: string,
  ): Promise<DestinationProposal> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        "BEGIN",
      );

      const proposal =
        await this.lockProposal(
          client,
          proposalId,
        );

      if (!proposal) {
        throw new AppError(
          "Propuesta no encontrada",
          404,
        );
      }

      if (
        proposal.estado !==
        "pendiente"
      ) {
        throw new AppError(
          "La propuesta ya fue revisada",
          409,
        );
      }

      await client.query(
        `
          UPDATE propuesta_destino

          SET
            estado =
              'rechazada',

            motivo_rechazo =
              $1,

            revisado_por =
              $2,

            fecha_revision =
              now(),

            destino_creado_id =
              NULL,

            fecha_actualizacion =
              now()

          WHERE id = $3
        `,
        [
          reason,
          adminUserId,
          proposalId,
        ],
      );

      await client.query(
        "COMMIT",
      );
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      throw error;
    } finally {
      client.release();
    }

    const reviewed =
      await this.findById(
        proposalId,
      );

    if (!reviewed) {
      throw new Error(
        "No se pudo recuperar la propuesta rechazada",
      );
    }

    return reviewed;
  }

  async countImages(
    proposalId: string,
  ): Promise<number> {
    const {
      rows,
    } =
      await this.pool
        .query<CountRow>(
          `
            SELECT
              COUNT(*) AS total

            FROM propuesta_destino_imagen

            WHERE propuesta_id = $1
          `,
          [
            proposalId,
          ],
        );

    return Number(
      rows[0]?.total ??
      0,
    );
  }

  async addImages(
    proposalId: string,

    images: Array<{
      url: string;
      publicId: string;
    }>,
  ): Promise<DestinationProposal> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        "BEGIN",
      );

      const {
        rows: proposalRows,
      } =
        await client.query<{
          estado:
            DestinationProposalStatus;
        }>(
          `
            SELECT estado

            FROM propuesta_destino

            WHERE id = $1

            FOR UPDATE
          `,
          [
            proposalId,
          ],
        );

      const proposal =
        proposalRows[0];

      if (!proposal) {
        throw new AppError(
          "Propuesta no encontrada",
          404,
        );
      }

      if (
        proposal.estado !==
        "pendiente"
      ) {
        throw new AppError(
          "Solo puedes modificar imágenes de una propuesta pendiente",
          409,
        );
      }

      const {
        rows: existingRows,
      } =
        await client.query<{
          orden: number;
        }>(
          `
            SELECT orden

            FROM propuesta_destino_imagen

            WHERE propuesta_id = $1

            ORDER BY orden ASC
          `,
          [
            proposalId,
          ],
        );

      const usedOrders =
        new Set(
          existingRows.map(
            (
              row,
            ) =>
              Number(
                row.orden,
              ),
          ),
        );

      const availableOrders =
        [
          1,
          2,
          3,
          4,
          5,
        ].filter(
          (
            order,
          ) =>
            !usedOrders.has(
              order,
            ),
        );

      if (
        images.length >
        availableOrders.length
      ) {
        throw new AppError(
          "Una propuesta puede tener como máximo 5 imágenes",
          400,
        );
      }

      for (
        let index = 0;
        index < images.length;
        index += 1
      ) {
        const image =
          images[index];

        const order =
          availableOrders[index];

        if (
          !image ||
          order === undefined
        ) {
          continue;
        }

        await client.query(
          `
            INSERT INTO propuesta_destino_imagen (
              id,
              propuesta_id,
              imagen_url,
              imagen_public_id,
              orden
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5
            )
          `,
          [
            randomUUID(),
            proposalId,
            image.url,
            image.publicId,
            order,
          ],
        );
      }

      await client.query(
        "COMMIT",
      );
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      throw error;
    } finally {
      client.release();
    }

    const proposal =
      await this.findById(
        proposalId,
      );

    if (!proposal) {
      throw new Error(
        "No se pudo recuperar la propuesta después de guardar las imágenes",
      );
    }

    return proposal;
  }

  async findImage(
    proposalId: string,

    imageId: string,
  ): Promise<
    DestinationProposalImage | null
  > {
    const {
      rows,
    } =
      await this.pool
        .query<ImageRow>(
          `
            SELECT
              id,
              imagen_url,
              imagen_public_id,
              orden,
              fecha_creacion

            FROM propuesta_destino_imagen

            WHERE propuesta_id = $1
              AND id = $2

            LIMIT 1
          `,
          [
            proposalId,
            imageId,
          ],
        );

    const row =
      rows[0];

    if (!row) {
      return null;
    }

    return {
      id:
        row.id,

      imageUrl:
        row.imagen_url,

      imagePublicId:
        row.imagen_public_id,

      order:
        Number(
          row.orden,
        ),

      createdAt:
        row.fecha_creacion,
    };
  }

  async deleteImageRecord(
    proposalId: string,

    imageId: string,
  ): Promise<boolean> {
    const {
      rowCount,
    } =
      await this.pool.query(
        `
          DELETE FROM propuesta_destino_imagen

          WHERE propuesta_id = $1
            AND id = $2
        `,
        [
          proposalId,
          imageId,
        ],
      );

    return (
      rowCount ??
      0
    ) > 0;
  }

  private async lockProposal(
    client: PoolClient,

    proposalId: string,
  ): Promise<
    LockedProposalRow | null
  > {
    const {
      rows,
    } =
      await client
        .query<LockedProposalRow>(
          `
            SELECT
              id,
              nombre,
              descripcion,
              categoria_id,
              ubicacion_id,
              estado

            FROM propuesta_destino

            WHERE id = $1

            FOR UPDATE
          `,
          [
            proposalId,
          ],
        );

    return rows[0] ??
      null;
  }

  private async categoryCanBeUsedWithClient(
    client: PoolClient,

    categoryId: string,
  ): Promise<boolean> {
    const {
      rows,
    } =
      await client.query<CountRow>(
        `
          SELECT COUNT(*) AS total

          FROM categoria

          WHERE id = $1
            AND aplica_destinos = true
        `,
        [
          categoryId,
        ],
      );

    return Number(
      rows[0]?.total ??
      0,
    ) > 0;
  }

  private async findImages(
    proposalId: string,
  ): Promise<
    DestinationProposalImage[]
  > {
    const {
      rows,
    } =
      await this.pool
        .query<ImageRow>(
          `
            SELECT
              id,
              imagen_url,
              imagen_public_id,
              orden,
              fecha_creacion

            FROM propuesta_destino_imagen

            WHERE propuesta_id = $1

            ORDER BY orden ASC
          `,
          [
            proposalId,
          ],
        );

    return rows.map(
      (
        row,
      ) => ({
        id:
          row.id,

        imageUrl:
          row.imagen_url,

        imagePublicId:
          row.imagen_public_id,

        order:
          row.orden,

        createdAt:
          row.fecha_creacion,
      }),
    );
  }

  private async mapMany(
    rows: ProposalRow[],
  ): Promise<
    DestinationProposal[]
  > {
    return Promise.all(
      rows.map(
        async (
          row,
        ) =>
          this.map(
            row,

            await this.findImages(
              row.id,
            ),
          ),
      ),
    );
  }

  private map(
    row: ProposalRow,

    images:
      DestinationProposalImage[],
  ): DestinationProposal {
    return {
      id:
        row.id,

      userId:
        row.usuario_id,

      name:
        row.nombre,

      description:
        row.descripcion,

      categoryId:
        row.categoria_id,

      categoryName:
        row.categoria_nombre,

      locationId:
        row.ubicacion_id,

      location: {
        id:
          row.ubicacion_id,

        latitude:
          Number(
            row.latitud,
          ),

        longitude:
          Number(
            row.longitud,
          ),

        address:
          row.direccion,

        municipality:
          row.municipio,

        state:
          row.estado_ubicacion,

        mapProvider:
          row.proveedor_mapa,
      },

      status:
        row.estado,

      rejectionReason:
        row.motivo_rechazo,

      reviewedBy:
        row.revisado_por,

      reviewedAt:
        row.fecha_revision,

      createdDestinationId:
        row.destino_creado_id,

      createdAt:
        row.fecha_creacion,

      updatedAt:
        row.fecha_actualizacion,

      images,
    };
  }
}
