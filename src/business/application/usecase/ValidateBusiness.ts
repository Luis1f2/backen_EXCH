import type { Pool } from "pg";

import { AppError } from "../../../user/application/errors/AppError.js";

export type ValidateAction =
  | "approve"
  | "reject";

export interface ValidateBusinessResult {
  businessId: string;
  action: ValidateAction;
  isVerified: boolean;
  requestStatus:
    | "aprobado"
    | "rechazado";
}

export class ValidateBusiness {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    businessId: string,
    action: ValidateAction
  ): Promise<ValidateBusinessResult> {
    const client =
      await this.pool.connect();

    try {
      await client.query("BEGIN");

      const { rows } =
        await client.query<{
          id: string;
        }>(
          `SELECT id
           FROM negocio_turistico
           WHERE id = $1
             AND activo = true
           LIMIT 1`,
          [businessId]
        );

      if (!rows.length) {
        throw new AppError(
          "Negocio no encontrado",
          404
        );
      }

      const isVerified =
        action === "approve";

      const requestStatus =
        isVerified
          ? "aprobado"
          : "rechazado";

      await client.query(
        `UPDATE negocio_turistico
         SET esta_verificado = $1
         WHERE id = $2`,
        [
          isVerified,
          businessId
        ]
      );

      const result =
        await client.query(
          `UPDATE negocio_administrador
           SET estado_solicitud = $1
           WHERE negocio_id = $2
             AND activo = true`,
          [
            requestStatus,
            businessId
          ]
        );

      if (
        (result.rowCount ?? 0) === 0
      ) {
        throw new AppError(
          "No se encontró la solicitud del negocio",
          404
        );
      }

      await client.query("COMMIT");

      return {
        businessId,
        action,
        isVerified,
        requestStatus
      };
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  }
}