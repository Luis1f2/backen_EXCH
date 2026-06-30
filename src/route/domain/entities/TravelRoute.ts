export interface RouteDestination {
  destinationId: string;
  visitOrder: number;
  visitDay: number;
}

export interface TravelRoute {
  id: string;
  userId: string | null;
  name: string;
  budget: number | null;
  durationDays: number | null;
  createdAt: Date;
  isPersonalized: boolean;
  destinations: RouteDestination[];
}