import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { BusinessSchedule } from "../../domain/entities/BusinessSchedule.js";
import type {
  BusinessScheduleRepository,
  ReplaceBusinessScheduleData
} from "../../domain/repositories/BusinessScheduleRepository.js";

interface BusinessScheduleRow {
  id: string;
  negocio_id: string;
  dia_semana: number;
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: boolean;
}

export class MySqlBusinessScheduleRepository
  implements BusinessScheduleRepository
{
  constructor(
    private readonly databasePool: Pool
  ) {}

  async listByBusinessId(
    businessId: string
  ): Promise<BusinessSchedule[]> {
    const { rows } =
      await this.databasePool.query<BusinessScheduleRow>(
        `SELECT
           id,
           negocio_id,
           dia_semana,
           TO_CHAR(hora_apertura, 'HH24:MI:SS') AS hora_apertura,
           TO_CHAR(hora_cierre, 'HH24:MI:SS') AS hora_cierre,
           cerrado
         FROM negocio_horario
         WHERE negocio_id = $1
         ORDER BY dia_semana ASC`,
        [businessId]
      );

    return rows.map((row) => this.mapToDomain(row));
  }

  async replace(
    businessId: string,
    schedules: ReplaceBusinessScheduleData[]
  ): Promise<BusinessSchedule[]> {
    const client = await this.databasePool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM negocio_horario WHERE negocio_id = $1`,
        [businessId]
      );

      for (const schedule of schedules) {
        const openingTime = schedule.closed ? null : schedule.openingTime;
        const closingTime = schedule.closed ? null : schedule.closingTime;

        await client.query(
          `INSERT INTO negocio_horario (
             id,
             negocio_id,
             dia_semana,
             hora_apertura,
             hora_cierre,
             cerrado
           )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            randomUUID(),
            businessId,
            schedule.dayOfWeek,
            openingTime,
            closingTime,
            schedule.closed
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return this.listByBusinessId(businessId);
  }

  private mapToDomain(
    row: BusinessScheduleRow
  ): BusinessSchedule {
    return {
      id: row.id,
      businessId: row.negocio_id,
      dayOfWeek: row.dia_semana,
      openingTime: row.hora_apertura,
      closingTime: row.hora_cierre,
      closed: Boolean(row.cerrado)
    };
  }
}
