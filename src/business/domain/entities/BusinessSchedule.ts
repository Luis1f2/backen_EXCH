export interface BusinessSchedule {
  id: string;
  businessId: string;
  dayOfWeek: number;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
}