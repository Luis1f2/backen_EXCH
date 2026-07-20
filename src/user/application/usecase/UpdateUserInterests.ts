import type { Pool } from "pg";

import { AppError } from "../errors/AppError.js";

import {
  GetUserInterests,
  type UserInterestsResult
} from "./GetUserInterests.js";

interface UserRow {
  id: string;
}

interface CategoryRow {
  id: string;
}

export class UpdateUserInterests {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    userId: string,
    categoryIds: string[]
  ): Promise<UserInterestsResult> {
    /*
     * Evitamos insertar la misma categoría
     * más de una vez.
     */
    const uniqueCategoryIds = [
      ...new Set(categoryIds)
    ];

    if (uniqueCategoryIds.length === 0) {
      throw new AppError(
        "Debes seleccionar al menos un interés",
        400
      );
    }

    const client =
      await this.pool.connect();

    try {
      await client.query("BEGIN");

      /*
       * Bloqueamos temporalmente el usuario
       * mientras actualizamos sus intereses.
       */
      const { rows: userRows } =
        await client.query<UserRow>(
          `
            SELECT id
            FROM usuario
            WHERE id = $1
              AND activo = true
            LIMIT 1
            FOR UPDATE
          `,
          [userId]
        );

      if (!userRows[0]) {
        throw new AppError(
          "Usuario no encontrado",
          404
        );
      }

      /*
       * Validamos que TODAS las categorías
       * recibidas existan, estén activas y
       * puedan utilizarse como intereses
       * turísticos.
       */
      const { rows: categoryRows } =
        await client.query<CategoryRow>(
          `
            SELECT id
            FROM categoria
            WHERE id = ANY($1::uuid[])
              AND activo = true
              AND aplica_destinos = true
          `,
          [uniqueCategoryIds]
        );

      if (
        categoryRows.length !==
        uniqueCategoryIds.length
      ) {
        throw new AppError(
          "Una o más categorías no existen o no están disponibles como interés",
          400
        );
      }

      /*
       * PUT significa reemplazar el conjunto
       * completo de intereses.
       *
       * Primero eliminamos los anteriores.
       */
      await client.query(
        `
          DELETE FROM usuario_interes
          WHERE usuario_id = $1
        `,
        [userId]
      );

      /*
       * Insertamos los nuevos intereses.
       */
      await client.query(
        `
          INSERT INTO usuario_interes (
            usuario_id,
            categoria_id
          )
          SELECT
            $1::uuid,
            UNNEST($2::uuid[])
          ON CONFLICT (
            usuario_id,
            categoria_id
          )
          DO NOTHING
        `,
        [
          userId,
          uniqueCategoryIds
        ]
      );

      /*
       * Desde este momento el onboarding
       * queda persistido en Supabase.
       */
      await client.query(
        `
          UPDATE usuario
          SET
            onboarding_completado = true,
            fecha_actualizacion = now()
          WHERE id = $1
            AND activo = true
        `,
        [userId]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }

    /*
     * Devolvemos el estado actualizado
     * directamente desde PostgreSQL.
     */
    return new GetUserInterests(
      this.pool
    ).execute(userId);
  }
}