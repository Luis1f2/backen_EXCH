import { randomUUID } from "node:crypto";

import type {
  Pool,
  RowDataPacket
} from "mysql2/promise";

import type { BusinessSchedule } from "../../domain/entities/BusinessSchedule.js";
import type {
  BusinessScheduleRepository,
  ReplaceBusinessScheduleData
} from "../../domain/repositories/BusinessScheduleRepository.js";

interface BusinessScheduleRow extends RowDataPacket {
  id: string;
  negocio_id: string;
  dia_semana: number;
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: number;
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
    const [rows] =
      await this.databasePool.execute<BusinessScheduleRow[]>(
        `SELECT
           id,
           negocio_id,
           dia_semana,
           TIME_FORMAT(hora_apertura, '%H:%i:%s')
             AS hora_apertura,
           TIME_FORMAT(hora_cierre, '%H:%i:%s')
             AS hora_cierre,
           cerrado
         FROM negocio_horario
         WHERE negocio_id = ?
         ORDER BY dia_semana ASC`,
        [businessId]
      );

    return rows.map((row) => this.mapToDomain(row));
  }

  async replace(
    businessId: string,
    schedules: ReplaceBusinessScheduleData[]
  ): Promise<BusinessSchedule[]> {
    const connection =
      await this.databasePool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `DELETE FROM negocio_horario
         WHERE negocio_id = ?`,
        [businessId]
      );

      for (const schedule of schedules) {
        const openingTime = schedule.closed
          ? null
          : schedule.openingTime;

        const closingTime = schedule.closed
          ? null
          : schedule.closingTime;

        await connection.execute(
          `INSERT INTO negocio_horario (
             id,
             negocio_id,
             dia_semana,
             hora_apertura,
             hora_cierre,
             cerrado
           )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            businessId,
            schedule.dayOfWeek,
            openingTime,
            closingTime,
            schedule.closed ? 1 : 0
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
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