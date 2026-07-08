import type {
  NextFunction,
  Request,
  Response
} from "express";

import { z } from "zod";

import type { ReplaceBusinessSchedules } from "../../application/usecase/ReplaceBusinessSchedules.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
    "La hora debe usar el formato HH:mm o HH:mm:ss"
  );

const scheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7),
    openingTime: timeSchema.nullable().optional(),
    closingTime: timeSchema.nullable().optional(),
    closed: z.boolean()
  })
  .superRefine((schedule, context) => {
    const openingTime = schedule.openingTime ?? null;
    const closingTime = schedule.closingTime ?? null;

    if (schedule.closed) {
      if (openingTime !== null || closingTime !== null) {
        context.addIssue({
          code: "custom",
          message:
            "Un día cerrado no debe contener horas de apertura o cierre"
        });
      }

      return;
    }

    if (openingTime === null) {
      context.addIssue({
        code: "custom",
        path: ["openingTime"],
        message: "La hora de apertura es obligatoria"
      });
    }

    if (closingTime === null) {
      context.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "La hora de cierre es obligatoria"
      });
    }

    if (
      openingTime !== null &&
      closingTime !== null &&
      normalizeTime(openingTime) >= normalizeTime(closingTime)
    ) {
      context.addIssue({
        code: "custom",
        path: ["closingTime"],
        message:
          "La hora de cierre debe ser posterior a la hora de apertura"
      });
    }
  });

const replaceSchedulesSchema = z
  .object({
    schedules: z
      .array(scheduleSchema)
      .min(1)
      .max(7)
  })
  .superRefine((input, context) => {
    const days = input.schedules.map(
      (schedule) => schedule.dayOfWeek
    );

    const uniqueDays = new Set(days);

    if (uniqueDays.size !== days.length) {
      context.addIssue({
        code: "custom",
        path: ["schedules"],
        message:
          "No se puede registrar dos veces el mismo día"
      });
    }
  });

function normalizeTime(time: string): string {
  return time.length === 5
    ? `${time}:00`
    : time;
}

export class ReplaceBusinessSchedulesController {
  constructor(
    private readonly replaceBusinessSchedules:
      ReplaceBusinessSchedules
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest =
        request as AuthenticatedRequest;

      const { id } = paramsSchema.parse(request.params);

      const input =
        replaceSchedulesSchema.parse(request.body);

      const schedules =
        await this.replaceBusinessSchedules.execute(
          authenticatedRequest.userId,
          id,
          {
            schedules: input.schedules.map(
              (schedule) => ({
                dayOfWeek: schedule.dayOfWeek,
                openingTime: schedule.openingTime
                  ? normalizeTime(schedule.openingTime)
                  : null,
                closingTime: schedule.closingTime
                  ? normalizeTime(schedule.closingTime)
                  : null,
                closed: schedule.closed
              })
            )
          }
        );

      response.status(200).json({
        success: true,
        message:
          "Horarios del negocio actualizados correctamente",
        data: schedules
      });
    } catch (error) {
      next(error);
    }
  };
}