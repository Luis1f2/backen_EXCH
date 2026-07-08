import type { BusinessSchedule } from "../entities/BusinessSchedule.js";

export interface ReplaceBusinessScheduleData {
  dayOfWeek: number;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
}

export interface BusinessScheduleRepository {
  listByBusinessId(
    businessId: string
  ): Promise<BusinessSchedule[]>;

  replace(
    businessId: string,
    schedules: ReplaceBusinessScheduleData[]
  ): Promise<BusinessSchedule[]>;
}