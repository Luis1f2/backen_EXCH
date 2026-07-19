import type { Pool } from "pg";
import { AppError } from "../../../user/application/errors/AppError.js";

export type ValidateAction = "approve" | "reject";

export interface ValidateBusinessResult {
  businessId: string;
  action: ValidateAction;
  isVerified: boolean;
}

export class ValidateBusiness {
  constructor(private readonly pool: Pool) {}

  async execute(
    businessId: string,
    action: ValidateAction
  ): Promise<ValidateBusinessResult> {
    const { rows } = await this.pool.query<{ id: string }>(
      "SELECT id FROM negocio_turistico WHERE id = $1 AND activo = true LIMIT 1",
      [businessId]
    );

    if (!rows.length) {
      throw new AppError("Negocio no encontrado", 404);
    }

    const isVerified = action === "approve";

    await this.pool.query(
      "UPDATE negocio_turistico SET esta_verificado = $1 WHERE id = $2",
      [isVerified, businessId]
    );

    await this.pool.query(
      `UPDATE negocio_administrador
       SET estado_solicitud = $1
       WHERE negocio_id = $2`,
      [isVerified ? "aprobada" : "rechazada", businessId]
    );

    return { businessId, action, isVerified };
  }
}
