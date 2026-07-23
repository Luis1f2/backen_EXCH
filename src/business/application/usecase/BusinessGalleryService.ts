import {
  randomUUID,
} from "node:crypto";

import type {
  Pool,
} from "pg";

import type {
  ImageStorage,
} from "../../../upload/application/ports/ImageStorage.js";

import {
  AppError,
} from "../../../user/application/errors/AppError.js";

interface BusinessGalleryRow {
  id: string;
  negocio_id: string;
  url_imagen: string;
  public_id: string | null;
  descripcion: string | null;
  orden: number;
  es_portada: boolean;
  activo: boolean;
  fecha_subida: Date;
}

interface CountRow {
  total: string;
}

export interface BusinessGalleryImage {
  id: string;
  businessId: string;
  imageUrl: string;
  description: string | null;
  order: number;
  isCover: boolean;
  createdAt: Date;
}

export class BusinessGalleryService {
  private static readonly MAX_IMAGES = 20;

  constructor(
    private readonly pool: Pool,

    private readonly imageStorage:
      ImageStorage,
  ) {}

  async list(
    businessId: string,
  ): Promise<BusinessGalleryImage[]> {
    await this.ensureBusinessExists(
      businessId,
    );

    const {
      rows,
    } =
      await this.pool
        .query<BusinessGalleryRow>(
          `
            SELECT
              id,
              negocio_id,
              url_imagen,
              public_id,
              descripcion,
              orden,
              es_portada,
              activo,
              fecha_subida

            FROM negocio_imagen

            WHERE negocio_id = $1
              AND activo = true

            ORDER BY
              orden ASC,
              fecha_subida ASC
          `,
          [
            businessId,
          ],
        );

    return rows.map(
      (row) =>
        this.map(row),
    );
  }

  async upload(
    businessId: string,

    userId: string,

    files:
      Express.Multer.File[],
  ): Promise<BusinessGalleryImage[]> {
    await this.ensureOwner(
      businessId,
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

    const {
      rows: countRows,
    } =
      await this.pool
        .query<CountRow>(
          `
            SELECT
              COUNT(*) AS total

            FROM negocio_imagen

            WHERE negocio_id = $1
              AND activo = true
          `,
          [
            businessId,
          ],
        );

    const currentCount =
      Number(
        countRows[0]?.total ??
        0,
      );

    if (
      currentCount +
      files.length >
      BusinessGalleryService.MAX_IMAGES
    ) {
      throw new AppError(
        `El negocio puede tener como máximo ${BusinessGalleryService.MAX_IMAGES} imágenes en su galería. Actualmente tiene ${currentCount}.`,
        400,
      );
    }

    /*
     * Usamos el máximo histórico, incluso si hay
     * fotografías desactivadas, para mantener un
     * orden estable.
     */
    const {
      rows: orderRows,
    } =
      await this.pool.query<{
        max_order:
          number | null;
      }>(
        `
          SELECT
            MAX(orden) AS max_order

          FROM negocio_imagen

          WHERE negocio_id = $1
        `,
        [
          businessId,
        ],
      );

    let nextOrder =
      Number(
        orderRows[0]?.max_order ??
        -1,
      ) + 1;

    const uploaded:
      Array<{
        url: string;
        publicId: string;
      }> = [];

    try {
      /*
       * Primero Cloudinary.
       */
      for (
        const file
        of files
      ) {
        const stored =
          await this.imageStorage
            .upload(
              file.buffer,

              `negocios/${businessId}/galeria`,
            );

        uploaded.push(
          stored,
        );
      }

      /*
       * Después persistimos todas las referencias
       * en una sola transacción PostgreSQL.
       */
      const client =
        await this.pool.connect();

      try {
        await client.query(
          "BEGIN",
        );

        for (
          const image
          of uploaded
        ) {
          await client.query(
            `
              INSERT INTO negocio_imagen (
                id,
                negocio_id,
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
                false,
                true
              )
            `,
            [
              randomUUID(),
              businessId,
              image.url,
              image.publicId,
              nextOrder,
            ],
          );

          nextOrder += 1;
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
    } catch (error) {
      /*
       * Si algo falla después de subir a
       * Cloudinary, eliminamos las imágenes
       * recién creadas para evitar archivos
       * huérfanos.
       */
      await Promise.allSettled(
        uploaded.map(
          (image) =>
            this.imageStorage
              .delete(
                image.publicId,
              ),
        ),
      );

      throw error;
    }

    return this.list(
      businessId,
    );
  }

  async delete(
    businessId: string,

    imageId: string,

    userId: string,
  ): Promise<BusinessGalleryImage[]> {
    await this.ensureOwner(
      businessId,
      userId,
    );

    const {
      rows,
    } =
      await this.pool
        .query<BusinessGalleryRow>(
          `
            SELECT
              id,
              negocio_id,
              url_imagen,
              public_id,
              descripcion,
              orden,
              es_portada,
              activo,
              fecha_subida

            FROM negocio_imagen

            WHERE id = $1
              AND negocio_id = $2
              AND activo = true

            LIMIT 1
          `,
          [
            imageId,
            businessId,
          ],
        );

    const image =
      rows[0];

    if (!image) {
      throw new AppError(
        "Imagen de galería no encontrada",
        404,
      );
    }

    /*
     * Primero la ocultamos de la aplicación.
     */
    const {
      rowCount,
    } =
      await this.pool.query(
        `
          UPDATE negocio_imagen

          SET activo = false

          WHERE id = $1
            AND negocio_id = $2
            AND activo = true
        `,
        [
          imageId,
          businessId,
        ],
      );

    if (
      (
        rowCount ??
        0
      ) === 0
    ) {
      throw new AppError(
        "No se pudo eliminar la imagen",
        500,
      );
    }

    /*
     * Después eliminamos el recurso real
     * de Cloudinary.
     *
     * Si falla, restauramos el registro.
     */
    if (
      image.public_id
    ) {
      try {
        await this.imageStorage
          .delete(
            image.public_id,
          );
      } catch (error) {
        await this.pool.query(
          `
            UPDATE negocio_imagen

            SET activo = true

            WHERE id = $1
          `,
          [
            imageId,
          ],
        );

        throw error;
      }
    }

    return this.list(
      businessId,
    );
  }

  private async ensureBusinessExists(
    businessId: string,
  ): Promise<void> {
    const {
      rows,
    } =
      await this.pool
        .query<CountRow>(
          `
            SELECT
              COUNT(*) AS total

            FROM negocio_turistico

            WHERE id = $1
              AND activo = true
          `,
          [
            businessId,
          ],
        );

    if (
      Number(
        rows[0]?.total ??
        0,
      ) === 0
    ) {
      throw new AppError(
        "Negocio no encontrado",
        404,
      );
    }
  }

  private async ensureOwner(
    businessId: string,

    userId: string,
  ): Promise<void> {
    const {
      rows,
    } =
      await this.pool
        .query<CountRow>(
          `
            SELECT
              COUNT(*) AS total

            FROM negocio_administrador na

            INNER JOIN negocio_turistico n
              ON n.id =
                na.negocio_id

            WHERE na.negocio_id = $1
              AND na.usuario_id = $2
              AND na.rol = 'propietario'
              AND na.activo = true
              AND n.activo = true
          `,
          [
            businessId,
            userId,
          ],
        );

    if (
      Number(
        rows[0]?.total ??
        0,
      ) === 0
    ) {
      throw new AppError(
        "No tienes permisos para modificar la galería de este negocio",
        403,
      );
    }
  }

  private map(
    row:
      BusinessGalleryRow,
  ): BusinessGalleryImage {
    return {
      id:
        row.id,

      businessId:
        row.negocio_id,

      imageUrl:
        row.url_imagen,

      description:
        row.descripcion,

      order:
        Number(
          row.orden,
        ),

      isCover:
        Boolean(
          row.es_portada,
        ),

      createdAt:
        row.fecha_subida,
    };
  }
}
