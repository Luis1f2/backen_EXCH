import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
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
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      "SELECT id FROM negocio_turistico WHERE id = ? AND activo = 1 LIMIT 1",
      [businessId]
    );

    if (!(rows as RowDataPacket[]).length) {
      throw new AppError("Negocio no encontrado", 404);
    }

    const isVerified = action === "approve";

    await this.pool.execute<ResultSetHeader>(
      "UPDATE negocio_turistico SET esta_verificado = ? WHERE id = ?",
      [isVerified ? 1 : 0, businessId]
    );

    await this.pool.execute(
      `UPDATE negocio_administrador
       SET estado_solicitud = ?
       WHERE negocio_id = ?`,
      [isVerified ? "aprobada" : "rechazada", businessId]
    );

    return { businessId, action, isVerified };
  }
}
